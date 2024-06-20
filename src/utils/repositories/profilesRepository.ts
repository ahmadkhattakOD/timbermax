import { ValuesFilterUsers } from "pages/users/main/useUsers";
import { UserRoles } from "utils/helpers";
import supabase from "utils/supabase";

export interface ProfileSupabase {
  full_name: string;
  email: string;
  profile_picture: string;
  role: string;
  daily_wage: number;
  commission: number;
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
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData && userData.user) {
        const { data, error } = await supabase.functions.invoke("account", {
          body: {
            user: user,
            profile: profile,
            action: "signup",
            createdById: userData.user.id,
          },
        });

        if (data && data.status === "success" && error === null) {
          return data.data;
        }
        return null;
      }
      return null;
    } catch (error) {
      console.error("Error creating new user:", error);
      return null;
    }
  }

  public async setPassword(userId: string, newPassword: string) {
    try {
      const { data, error } = await supabase.functions.invoke("account", {
        body: {
          userId: userId,
          newPassword: newPassword,
          action: "setPassword",
        },
      });

      if (data && data.status === "success" && error === null) {
        return data.data;
      }
      return null;
    } catch (error) {
      console.error("Error creating new user:", error);
      return null;
    }
  }

  public async resetPassword(
    email: string,
    oldPassword: string,
    newPassword: string
  ) {
    try {
      const { data, error } = await supabase.functions.invoke("account", {
        body: {
          email: email,
          oldPassword: oldPassword,
          newPassword: newPassword,
          action: "resetPassword",
        },
      });

      if (data && data.status === "success" && error === null) {
        return data.data;
      }
      return null;
    } catch (error) {
      console.error("Error creating new user:", error);
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
        .neq("role", UserRoles.Admin);

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
        .order("created_at", { ascending: false })
        .neq("role", UserRoles.Admin);

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
      let deletedIdsCount = 0;
      for (let i = 0; i < ids.length; i++) {
        const { data, error } = await supabase
          .from(this.className)
          .delete()
          .eq("id", ids[i])
          .select();

        if (data && data.length > 0 && error === null) {
          deletedIdsCount += 1;
        }
      }

      return deletedIdsCount;
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
