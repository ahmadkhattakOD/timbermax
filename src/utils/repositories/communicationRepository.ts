import { ValuesFilterCommunication } from "pages/customers/edit/useEditCustomer";
import supabase from "utils/supabase";
import ProfilesRepository from "./profilesRepository";
import {
  downloadFile,
  getDateFormatted,
  getDateFormattedForField,
  getDateTimeFormattedForField,
} from "utils/helpers";

export interface CommunicationSupabase {
  customer: number;
  method: string;
  date?: Date | null;
  notes: string;
  files: string[];
}

class CommunicationRepository {
  private className = "communication";

  public async create(communication: CommunicationSupabase) {
    try {
      const { data, error } = await supabase
        .from(this.className)
        .insert(communication)
        .select();

      if (data && data.length > 0 && error === null) {
        return data[0];
      }
      return null;
    } catch (error) {
      console.error("Error creating new communication:", error);
      return null;
    }
  }

  public async get(
    id: number,
    orderBy: string,
    ascending: boolean,
    rangeStart: number,
    rangeEnd: number,
    limit: number,
    filters?: ValuesFilterCommunication
  ) {
    try {
      const query = supabase
        .from(this.className)
        .select("*", { count: "exact" })
        .order(orderBy, { ascending: ascending })
        .range(rangeStart, rangeEnd)
        .limit(limit)
        .eq("customer", id);

      if (filters) {
        if (filters.method) {
          query.eq("method", filters.method);
        }
        if (filters.dateFrom) {
          query.gte("date", filters.dateFrom);
        }
        if (filters.dateTo) {
          query.lte("date", filters.dateTo);
        }
      }

      const {
        data: communicationData,
        count: communicationCount,
        error: communicationError,
      } = await query;

      return { communicationData, communicationCount, communicationError };
    } catch (error) {
      console.error("Error fetching communication:", error);
      return null;
    }
  }

  public async getWithoutFilters() {
    try {
      const { data: communicationData, error: communicationError } =
        await supabase
          .from(this.className)
          .select("*")
          .order("created_at", { ascending: false });

      return { communicationData, communicationError };
    } catch (error) {
      console.error("Error fetching communication:", error);
      return null;
    }
  }

  public async getTodaysReminders() {
    try {
      const date = new Date();
      const startDateToday = new Date(date);
      startDateToday.setHours(0, 0, 0, 0);

      const endDateToday = new Date(date);
      endDateToday.setHours(23, 59, 59, 999);

      const { data: communicationData, error: communicationError } =
        await supabase
          .from(this.className)
          .select("id, method, customer (id, name), date, notes")
          .order("created_at", { ascending: false })
          .eq("method", "reminder")
          .gte("date", getDateTimeFormattedForField(startDateToday))
          .lte("date", getDateTimeFormattedForField(endDateToday));

      return { communicationData, communicationError };
    } catch (error) {
      console.error("Error fetching communication:", error);
      return null;
    }
  }

  public async getSingle(id: number) {
    try {
      const { data: communicationData, error: communicationError } =
        await supabase
          .from(this.className)
          .select("*")
          .eq("id", id)
          .limit(1)
          .maybeSingle();

      return { communicationData, communicationError };
    } catch (error) {
      console.error("Error fetching communication:", error);
      return null;
    }
  }

  public async edit(id: number, communication: CommunicationSupabase) {
    try {
      const { data, error } = await supabase
        .from(this.className)
        .update(communication)
        .eq("id", id)
        .select();

      if (data && data.length > 0 && error === null) {
        return data[0];
      }
      return null;
    } catch (error) {
      console.error("Error editing communication:", error);
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
      console.error("Error deleting communication:", error);
      return 0;
    }
  }

  public async uploadAttachmentsAndReturnUrls(
    files: File[]
  ): Promise<string[]> {
    try {
      const profilesRepository = new ProfilesRepository();
      const currentUser = await profilesRepository.getCurrentUser();
      if (currentUser) {
        let result = [];
        for (let i = 0; i < files.length; i++) {
          try {
            const fileName = files[i].name;
            const fileParts = fileName.split(".");
            const extension = fileParts.pop()?.toLowerCase();
            const baseName = fileParts.join(".");
            const timestamp = Date.now();
            const newFileName = `${baseName}_${timestamp}.${extension}`;
            const { data, error } = await supabase.storage
              .from("gallery")
              .upload(`${currentUser.id}/${newFileName}`, files[i], {
                upsert: true,
              });
            if (data && !error) {
              result.push(data.path);
            }
          } catch (error) {
            console.error("Error uploading attachment:", error);
            continue;
          }
        }
        return result;
      }
      return [];
    } catch (error) {
      console.error("Error uploading attachments:", error);
      return [];
    }
  }

  public async downloadAttachment(url: string) {
    try {
      const { data } = supabase.storage.from("gallery").getPublicUrl(url);

      if (data) {
        const fileName = url.split("/").pop();
        if (fileName) {
          await downloadFile(data.publicUrl, fileName);
          return true;
        }
        return false;
      }
      return false;
    } catch (error) {
      console.error("Error downloading attachment:", error);
      return false;
    }
  }

  public async deleteAttachments(urls: string[]) {
    try {
      const { data, error } = await supabase.storage
        .from("gallery")
        .remove(urls);
      if (data && !error) {
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error deleting attachment:", error);
      return false;
    }
  }
}
export default CommunicationRepository;
