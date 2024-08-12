import { ValuesFilterCustomers } from "pages/customers/main/useCustomers";
import supabase from "utils/supabase";

export interface CustomerSupabase {
  name: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  suburb?: string;
  state?: string;
  post_code?: string;
  // tags: string[];
  // lost_reason?: string;
  notes?: string;
}

class CustomersRepository {
  private className = "customers";

  public async create(customer: CustomerSupabase) {
    try {
      const query = supabase.from(this.className).select();

      if (customer.address) {
        query.eq("name", customer.name);
        query.eq("address", customer.address);

        const { data: existingData, error: existingError } = await query;

        if (existingData && existingData.length > 0 && !existingError) {
          return false;
        }
      }

      const { data, error } = await supabase
        .from(this.className)
        .insert(customer)
        .select();

      if (data && data.length > 0 && error === null) {
        return data[0];
      }
      return null;
    } catch (error) {
      console.error("Error creating new customer:", error);
      return null;
    }
  }

  public async get(
    orderBy: string,
    ascending: boolean,
    rangeStart: number,
    rangeEnd: number,
    limit: number,
    filters?: ValuesFilterCustomers
  ) {
    try {
      const query = supabase
        .from(this.className)
        .select("*", { count: "exact" })
        .order(orderBy, { ascending: ascending })
        .range(rangeStart, rangeEnd)
        .limit(limit);

      if (filters) {
        if (filters.name) {
          query.ilike("name", `%${filters.name}%`);
        }
        if (filters.email) {
          query.ilike("email", `%${filters.email}%`);
        }
        if (filters.phone) {
          query.ilike("phone", `${filters.phone}%`);
        }
        if (filters.mobile) {
          query.ilike("mobile", `${filters.mobile}%`);
        }
        if (filters.address) {
          query.ilike("address", `%${filters.address}%`);
        }
        if (filters.suburb) {
          query.ilike("suburb", `%${filters.suburb}%`);
        }
        if (filters.state) {
          query.eq("state", filters.state);
        }
        if (filters.postCode) {
          query.eq("post_code", filters.postCode);
        }
      }

      const {
        data: customersData,
        count: customersCount,
        error: customersError,
      } = await query;

      return { customersData, customersCount, customersError };
    } catch (error) {
      console.error("Error fetching customers:", error);
      return null;
    }
  }

  public async getWithoutFilters() {
    try {
      const { data: customersData, error: customersError } = await supabase
        .from(this.className)
        .select("id, name")
        .order("created_at", { ascending: true });

      return { customersData, customersError };
    } catch (error) {
      console.error("Error fetching customers:", error);
      return null;
    }
  }

  public async getByName(name: string) {
    try {
      const { data: customersData, error: customersError } = await supabase
        .from(this.className)
        .select(
          "id, name, email, phone, mobile, address, suburb, state, post_code"
        )
        .order("name", { ascending: true })
        .ilike("name", `%${name}%`);

      return { customersData, customersError };
    } catch (error) {
      console.error("Error fetching customers:", error);
      return null;
    }
  }

  public async getSingle(id: number) {
    try {
      const { data: customerData, error: customerError } = await supabase
        .from(this.className)
        .select("*")
        .eq("id", id)
        .limit(1)
        .maybeSingle();

      return { customerData, customerError };
    } catch (error) {
      console.error("Error fetching customer:", error);
      return null;
    }
  }

  public async edit(id: number, customer: CustomerSupabase) {
    try {
      const query = supabase.from(this.className).select();

      if (customer.address) {
        query.eq("name", customer.name);
        query.eq("address", customer.address);
        query.neq("id", id);

        const { data: existingData, error: existingError } = await query;

        if (existingData && existingData.length > 0 && !existingError) {
          return false;
        }
      }

      const { data, error } = await supabase
        .from(this.className)
        .update(customer)
        .eq("id", id)
        .select();

      if (data && data.length > 0 && error === null) {
        return data[0];
      }
      return null;
    } catch (error) {
      console.error("Error editing customer:", error);
      return null;
    }
  }

  public async delete(ids: readonly number[]) {
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
      console.error("Error deleting customers:", error);
      return 0;
    }
  }
}
export default CustomersRepository;
