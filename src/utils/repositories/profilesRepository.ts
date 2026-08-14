import { ValuesFilterUsers } from "pages/users/main/useUsers";
import { UserRoles } from "utils/helpers";
import supabase, { supabaseAdmin } from "utils/supabase";
import { createClient } from "@supabase/supabase-js";

export interface ProfileSupabase {
  full_name: string;
  email: string;
  profile_picture: string;
  role: string;
}

export interface UserSupabase {
  email: string;
  password: string;
}

export interface InvoiceRulesSupabase {
  show_days: number;
  travel_bonus: number;
  other_bonuses: number;
  deductions: number;
}

class ProfilesRepository {
  private className = "profiles";

  public async create(user: UserSupabase, profile: ProfileSupabase) {
    if (!supabaseAdmin) {
      throw new Error("Supabase admin client not initialized");
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      throw new Error(authError?.message || "Could not create the user's login.");
    }

    const { data, error } = await supabase
      .from("profiles")
      .insert({
        id: authData.user.id,
        email: authData.user.email,
        full_name: profile.full_name,
        role: profile.role,
        profile_picture: profile.profile_picture ?? null,
        status: "active",
      })
      .select()
      .single();

    if (error) {
      // Login was created but the profile insert failed — remove the orphaned auth user
      // so the email isn't stuck as "already registered" with no matching profile.
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id).catch(() => {});
      throw new Error(error.message || "Could not save the user's profile.");
    }

    return data;
  }

  public async setPassword(userId: string, newPassword: string) {
    try {
      if (!supabaseAdmin) {
        console.error("Supabase admin client not initialized");
        return null;
      }

      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword,
      });

      if (error) {
        console.error("Error setting password:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error setting password:", error);
      return null;
    }
  }

  public async resetPassword(
    email: string,
    oldPassword: string,
    newPassword: string
  ) {
    try {
      // Get current user to verify we have a valid session
      const { data: currentUserData } = await supabase.auth.getUser();
      const currentUser = currentUserData?.user;

      if (!currentUser || currentUser.email !== email) {
        console.error("No current session found or email mismatch");
        return null;
      }

      // Create a separate Supabase client instance for password verification
      // This client won't persist sessions, so it won't affect the main session
      const supabaseUrl = import.meta.env.VITE_APP_SUPABASE_URL ?? "";
      const supabaseKey = import.meta.env.VITE_APP_SUPABASE_KEY ?? "";
      const verificationClient = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });

      // Verify old password using the separate client (won't affect main session)
      const { data: loginData, error: loginError } =
        await verificationClient.auth.signInWithPassword({
          email: email,
          password: oldPassword,
        });

      if (loginError || !loginData.user) {
        console.error("Incorrect credentials:", loginError);
        // No need to restore session since we used a separate client
        return null;
      }

      // Verify that the user ID matches the current user
      if (loginData.user.id !== currentUser.id) {
        console.error("User ID mismatch");
        return null;
      }

      // Then update the password using admin API
      if (!supabaseAdmin) {
        console.error("Supabase admin client not initialized");
        return null;
      }

      const { data: updateData, error: updateError } =
        await supabaseAdmin.auth.admin.updateUserById(loginData.user.id, {
          password: newPassword,
        });

      if (updateError) {
        console.error("Error resetting password:", updateError);
        return null;
      }

      // Sign out after password reset for security
      await supabase.auth.signOut();

      return updateData;
    } catch (error) {
      console.error("Error resetting password:", error);
      return null;
    }
  }

  public async get(
    orderBy: string,
    ascending: boolean,
    rangeStart: number,
    rangeEnd: number,
    limit: number,
    filters?: ValuesFilterUsers,
    status: "active" | "inactive" = "active"
  ) {
    try {
      const query = supabase
        .from(this.className)
        .select("*", { count: "exact" })
        .order(orderBy, { ascending: ascending })
        .range(rangeStart, rangeEnd)
        .limit(limit)
        .eq("status", status)
        // .neq("role", UserRoles.Admin)
        .neq("role", UserRoles.SuperAdmin);

      if (filters) {
        if (filters.fullName) {
          query.ilike("full_name", `%${filters.fullName}%`);
        }
        if (filters.email) {
          query.ilike("email", `%${filters.email}%`);
        }
        if (filters.role) {
          query.eq("role", filters.role);
        }
        if (filters.minimumDailyWage) {
          query.gte("daily_wage", filters.minimumDailyWage);
        }
        if (filters.maximumDailyWage) {
          query.lte("daily_wage", filters.maximumDailyWage);
        }
        if (filters.minimumCommission) {
          query.gte("commission", filters.minimumCommission);
        }
        if (filters.maximumCommission) {
          query.lte("commission", filters.maximumCommission);
        }
        if (filters.joinedAtFrom) {
          query.gte("created_at", filters.joinedAtFrom);
        }
        if (filters.joinedAtTo) {
          query.lte("created_at", filters.joinedAtTo);
        }
      }

      const {
        data: profilesData,
        count: profilesCount,
        error: profilesError,
      } = await query;

      return { profilesData, profilesCount, profilesError };
    } catch (error) {
      console.error("Error fetching users:", error);
      return null;
    }
  }

  public async getWithoutFilters() {
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from(this.className)
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .neq("role", UserRoles.Admin)
        .neq("role", UserRoles.SuperAdmin);

      return { profilesData, profilesError };
    } catch (error) {
      console.error("Error fetching users:", error);
      return null;
    }
  }

  public async getSingle(id: string, filterActive: boolean = true) {
    try {
      const query = supabase
        .from(this.className)
        .select("*")
        .eq("id", id);

      if (filterActive) {
        query.eq("status", "active");
      }

      const { data: profileData, error: profileError } = await query
        .limit(1)
        .maybeSingle();

      return { profileData, profileError };
    } catch (error) {
      console.error("Error fetching user:", error);
      return null;
    }
  }

  public async edit(id: string, profile: ProfileSupabase) {
    try {
      const { data, error } = await supabase
        .from(this.className)
        .update(profile)
        .eq("id", id)
        .select();

      if (data && data.length > 0 && error === null) {
        return data[0];
      }
      return null;
    } catch (error) {
      console.error("Error editing user:", error);
      return null;
    }
  }

  public async editInvoiceRules(
    id: string,
    invoiceRules: InvoiceRulesSupabase
  ) {
    try {
      const { data, error } = await supabase
        .from(this.className)
        .update({ invoice_rules: invoiceRules })
        .eq("id", id)
        .select();

      if (data && data.length > 0 && error === null) {
        return data[0];
      }
      return null;
    } catch (error) {
      console.error("Error editing user:", error);
      return null;
    }
  }

  public async editFullName(id: string, fullName: string) {
    try {
      const { data, error } = await supabase
        .from(this.className)
        .update({ full_name: fullName })
        .eq("id", id)
        .select();

      if (data && data.length > 0 && error === null) {
        return data[0];
      }
      return null;
    } catch (error) {
      console.error("Error editing user:", error);
      return null;
    }
  }

  public async disable(ids: readonly string[]) {
    try {
      const { data, error } = await supabase
        .from(this.className)
        .update({ status: "inactive" })
        .in("id", ids)
        .select();

      if (data && data.length > 0 && error === null) {
        return data.length;
      }
      return 0;
    } catch (error) {
      console.error("Error disabling users:", error);
      return 0;
    }
  }

  public async enable(ids: readonly string[]) {
    try {
      const { data, error } = await supabase
        .from(this.className)
        .update({ status: "active" })
        .in("id", ids)
        .select();

      if (data && data.length > 0 && error === null) {
        return data.length;
      }
      return 0;
    } catch (error) {
      console.error("Error enabling users:", error);
      return 0;
    }
  }

  public async loginUser(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (data.user !== null && error === null) {
        return data.user;
      }
      return null;
    } catch (error) {
      console.error("Error logging in user:", error);
      return null;
    }
  }

  public async logoutUser() {
    try {
      const { error } = await supabase.auth.signOut();

      if (error === null) {
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error logging out user:", error);
      return false;
    }
  }

  public async getCurrentUser() {
    try {
      const { data, error } = await supabase.auth.getUser();

      if (data.user !== null && error === null) {
        return data.user;
      }
      return null;
    } catch (error) {
      console.error("Error fetching current user:", error);
      return null;
    }
  }
}

export default ProfilesRepository;
