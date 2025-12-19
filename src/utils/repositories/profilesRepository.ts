import { ValuesFilterUsers } from "pages/users/main/useUsers";
import { UserRoles } from "utils/helpers";
import supabase from "utils/supabase";

export interface ProfileSupabase {
  full_name: string;
  email: string;
  profile_picture: string;
  role: string;
  daily_wage: number;
  commissions: number[];
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

  public async create(user: UserSupabase, profile: ProfileSupabase, createdById?: string) {
    try {
      // First, create the user with Supabase Auth using admin API
      const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
      });

      if (userError || !userData.user) {
        console.error("Error creating auth user:", userError);
        return null;
      }

      // Then create the profile in the profiles table
      const { data, error } = await supabase
        .from(this.className)
        .insert({
          id: userData.user.id,
          full_name: profile.full_name,
          email: userData.user.email,
          role: profile.role,
          daily_wage: profile.daily_wage,
          commissions: profile.commissions ?? [],
          profile_picture: profile.profile_picture,
          status: "active",
          created_at: new Date().toISOString(),
          user: createdById, // This matches your edge function logic
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating profile:", error);
        // Clean up: delete the auth user if profile creation fails
        await supabase.auth.admin.deleteUser(userData.user.id);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error creating new user:", error);
      return null;
    }
  }

  public async setPassword(userId: string, newPassword: string) {
    try {
      const { data, error } = await supabase.auth.admin.updateUserById(userId, {
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
      // First, verify old password by signing in
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: email,
        password: oldPassword,
      });

      if (loginError || !loginData.user) {
        console.error("Incorrect credentials:", loginError);
        return null;
      }

      // Then update the password using admin API
      const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
        loginData.user.id,
        { password: newPassword }
      );

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
    filters?: ValuesFilterUsers
  ) {
    try {
      const query = supabase
        .from(this.className)
        .select("*", { count: "exact" })
        .order(orderBy, { ascending: ascending })
        .range(rangeStart, rangeEnd)
        .limit(limit)
        .eq("status", "active")
        .neq("role", UserRoles.Admin)
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

  public async getSingle(id: string) {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from(this.className)
        .select("*")
        .eq("id", id)
        .eq("status", "active")
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

  public async delete(ids: readonly string[]) {
    try {
      const { data, error } = await supabase
        .from(this.className)
        .update({ status: "inactive" })
        .in("id", ids)
        .select();

      if (data && data.length > 0 && error === null) {
        // Optionally, also delete auth users if needed
        // await Promise.all(ids.map(id => supabase.auth.admin.deleteUser(id)));
        return data.length;
      }
      return 0;
    } catch (error) {
      console.error("Error deleting users:", error);
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