import { ValuesFilterCustomers } from "pages/customers/main/useCustomers";
import { extendedDataLimit } from "utils/helpers";
import supabase from "utils/supabase";

export interface CustomerAddress {
  address: string;
  suburb: string;
  state: string;
  post_code: string;
  is_primary?: boolean; // Flag to mark primary address
}

export interface CustomerSupabase {
  name: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  suburb?: string;
  state?: string;
  post_code?: string;
  addresses?: CustomerAddress[];
  // tags: string[];
  // lost_reason?: string;
  notes?: string;
}

class CustomersRepository {
  private className = "customers";

  public async create(customer: CustomerSupabase) {
    try {
      // Convert to database format
      const dbCustomer: any = {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        mobile: customer.mobile,
        notes: customer.notes,
      };

      // Handle addresses array
      if (customer.addresses && customer.addresses.length > 0) {
        dbCustomer.addresses = customer.addresses;

        // For backward compatibility, also set the primary address to individual fields
        const primaryAddress =
          customer.addresses.find((addr) => addr.is_primary) ||
          customer.addresses[0];
        if (primaryAddress) {
          dbCustomer.address = primaryAddress.address;
          dbCustomer.suburb = primaryAddress.suburb;
          dbCustomer.state = primaryAddress.state;
          dbCustomer.post_code = primaryAddress.post_code;
        }
      } else {
        dbCustomer.addresses = [];
      }

      const { data, error } = await supabase
        .from(this.className)
        .insert(dbCustomer)
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
    filters?: ValuesFilterCustomers,
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
        .select("id, name, email, phone, mobile, addresses, notes")
        .order("name", { ascending: true })
        .ilike("name", `%${name}%`)
        .limit(extendedDataLimit);

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
      // Convert to database format
      const dbCustomer = {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        mobile: customer.mobile,
        addresses: customer.addresses || [],
        notes: customer.notes,
      };

      const { data, error } = await supabase
        .from(this.className)
        .update(dbCustomer)
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
      const { data, error } = await supabase
        .from(this.className)
        .delete()
        .in("id", ids)
        .select();

      if (data && data.length > 0 && error === null) {
        return data.length;
      }
      return 0;
    } catch (error) {
      console.error("Error deleting customers:", error);
      return 0;
    }
  }
}
export default CustomersRepository;
