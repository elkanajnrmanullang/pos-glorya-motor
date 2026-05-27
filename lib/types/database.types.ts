export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      barang: {
        Row: {
          aktif: boolean | null
          barcode: string | null
          cabang_id: string | null
          created_at: string | null
          foto_url: string | null
          harga_beli: number
          harga_jual: number
          id: string
          nama: string
          satuan: string | null
          stok_fisik: number
          stok_minimum: number | null
          stok_reserved: number
          stok_tersedia: number | null
          updated_at: string | null
        }
        Insert: {
          aktif?: boolean | null
          barcode?: string | null
          cabang_id?: string | null
          created_at?: string | null
          foto_url?: string | null
          harga_beli: number
          harga_jual: number
          id?: string
          nama: string
          satuan?: string | null
          stok_fisik?: number
          stok_minimum?: number | null
          stok_reserved?: number
          stok_tersedia?: number | null
          updated_at?: string | null
        }
        Update: {
          aktif?: boolean | null
          barcode?: string | null
          cabang_id?: string | null
          created_at?: string | null
          foto_url?: string | null
          harga_beli?: number
          harga_jual?: number
          id?: string
          nama?: string
          satuan?: string | null
          stok_fisik?: number
          stok_minimum?: number | null
          stok_reserved?: number
          stok_tersedia?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "barang_cabang_id_fkey"
            columns: ["cabang_id"]
            isOneToOne: false
            referencedRelation: "cabang"
            referencedColumns: ["id"]
          },
        ]
      }
      cabang: {
        Row: {
          aktif: boolean | null
          alamat: string | null
          created_at: string | null
          id: string
          nama: string
        }
        Insert: {
          aktif?: boolean | null
          alamat?: string | null
          created_at?: string | null
          id?: string
          nama: string
        }
        Update: {
          aktif?: boolean | null
          alamat?: string | null
          created_at?: string | null
          id?: string
          nama?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          cabang_id: string | null
          created_at: string | null
          id: string
          nama: string
          no_telp: string
          updated_at: string | null
        }
        Insert: {
          cabang_id?: string | null
          created_at?: string | null
          id?: string
          nama: string
          no_telp: string
          updated_at?: string | null
        }
        Update: {
          cabang_id?: string | null
          created_at?: string | null
          id?: string
          nama?: string
          no_telp?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_cabang_id_fkey"
            columns: ["cabang_id"]
            isOneToOne: false
            referencedRelation: "cabang"
            referencedColumns: ["id"]
          },
        ]
      }
      pengeluaran_kasir: {
        Row: {
          cabang_id: string | null
          id: string
          jumlah: number
          kasir_id: string
          kategori: string | null
          keterangan: string
          sesi_id: string
          waktu: string | null
        }
        Insert: {
          cabang_id?: string | null
          id?: string
          jumlah: number
          kasir_id: string
          kategori?: string | null
          keterangan: string
          sesi_id: string
          waktu?: string | null
        }
        Update: {
          cabang_id?: string | null
          id?: string
          jumlah?: number
          kasir_id?: string
          kategori?: string | null
          keterangan?: string
          sesi_id?: string
          waktu?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pengeluaran_kasir_cabang_id_fkey"
            columns: ["cabang_id"]
            isOneToOne: false
            referencedRelation: "cabang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pengeluaran_kasir_kasir_id_fkey"
            columns: ["kasir_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pengeluaran_kasir_sesi_id_fkey"
            columns: ["sesi_id"]
            isOneToOne: false
            referencedRelation: "sesi_kasir"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          cabang_id: string | null
          created_at: string | null
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          cabang_id?: string | null
          created_at?: string | null
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          cabang_id?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "profiles_cabang_id_fkey"
            columns: ["cabang_id"]
            isOneToOne: false
            referencedRelation: "cabang"
            referencedColumns: ["id"]
          },
        ]
      }
      sesi_kasir: {
        Row: {
          cabang_id: string | null
          cash_aktual: number | null
          cash_sistem: number | null
          catatan: string | null
          created_at: string | null
          id: string
          kasir_id: string
          laporan_terkirim: boolean | null
          modal_awal: number
          qris_aktual: number | null
          qris_sistem: number | null
          selisih_cash: number | null
          selisih_qris: number | null
          selisih_transfer: number | null
          status: Database["public"]["Enums"]["status_sesi"]
          total_pengeluaran: number | null
          transfer_aktual: number | null
          transfer_sistem: number | null
          waktu_buka: string | null
          waktu_tutup: string | null
        }
        Insert: {
          cabang_id?: string | null
          cash_aktual?: number | null
          cash_sistem?: number | null
          catatan?: string | null
          created_at?: string | null
          id?: string
          kasir_id: string
          laporan_terkirim?: boolean | null
          modal_awal?: number
          qris_aktual?: number | null
          qris_sistem?: number | null
          selisih_cash?: number | null
          selisih_qris?: number | null
          selisih_transfer?: number | null
          status?: Database["public"]["Enums"]["status_sesi"]
          total_pengeluaran?: number | null
          transfer_aktual?: number | null
          transfer_sistem?: number | null
          waktu_buka?: string | null
          waktu_tutup?: string | null
        }
        Update: {
          cabang_id?: string | null
          cash_aktual?: number | null
          cash_sistem?: number | null
          catatan?: string | null
          created_at?: string | null
          id?: string
          kasir_id?: string
          laporan_terkirim?: boolean | null
          modal_awal?: number
          qris_aktual?: number | null
          qris_sistem?: number | null
          selisih_cash?: number | null
          selisih_qris?: number | null
          selisih_transfer?: number | null
          status?: Database["public"]["Enums"]["status_sesi"]
          total_pengeluaran?: number | null
          transfer_aktual?: number | null
          transfer_sistem?: number | null
          waktu_buka?: string | null
          waktu_tutup?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sesi_kasir_cabang_id_fkey"
            columns: ["cabang_id"]
            isOneToOne: false
            referencedRelation: "cabang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sesi_kasir_kasir_id_fkey"
            columns: ["kasir_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tiket_items: {
        Row: {
          barang_id: string
          created_at: string | null
          harga_snapshot: number
          id: string
          qty: number
          status: Database["public"]["Enums"]["status_item"]
          tiket_id: string
        }
        Insert: {
          barang_id: string
          created_at?: string | null
          harga_snapshot: number
          id?: string
          qty?: number
          status?: Database["public"]["Enums"]["status_item"]
          tiket_id: string
        }
        Update: {
          barang_id?: string
          created_at?: string | null
          harga_snapshot?: number
          id?: string
          qty?: number
          status?: Database["public"]["Enums"]["status_item"]
          tiket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tiket_items_barang_id_fkey"
            columns: ["barang_id"]
            isOneToOne: false
            referencedRelation: "barang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tiket_items_tiket_id_fkey"
            columns: ["tiket_id"]
            isOneToOne: false
            referencedRelation: "tiket_servis"
            referencedColumns: ["id"]
          },
        ]
      }
      tiket_jasa: {
        Row: {
          created_at: string | null
          harga_jasa: number
          id: string
          nama_jasa: string
          tiket_id: string
        }
        Insert: {
          created_at?: string | null
          harga_jasa: number
          id?: string
          nama_jasa: string
          tiket_id: string
        }
        Update: {
          created_at?: string | null
          harga_jasa?: number
          id?: string
          nama_jasa?: string
          tiket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tiket_jasa_tiket_id_fkey"
            columns: ["tiket_id"]
            isOneToOne: false
            referencedRelation: "tiket_servis"
            referencedColumns: ["id"]
          },
        ]
      }
      tiket_servis: {
        Row: {
          cabang_id: string | null
          cc_motor: number | null
          customer_id: string | null
          id: string
          kasir_id: string | null
          keluhan: string | null
          mekanik_id: string | null
          merk_motor: string
          metode_bayar: Database["public"]["Enums"]["metode_bayar"] | null
          nomor_antrian: string
          plat_motor: string
          sesi_id: string | null
          status: Database["public"]["Enums"]["status_tiket"]
          tahun_motor: number | null
          tipe: Database["public"]["Enums"]["tipe_transaksi"]
          total_akhir: number | null
          total_jasa: number | null
          total_part: number | null
          waktu_lunas: string | null
          waktu_masuk: string | null
          waktu_mulai: string | null
          waktu_selesai: string | null
        }
        Insert: {
          cabang_id?: string | null
          cc_motor?: number | null
          customer_id?: string | null
          id?: string
          kasir_id?: string | null
          keluhan?: string | null
          mekanik_id?: string | null
          merk_motor: string
          metode_bayar?: Database["public"]["Enums"]["metode_bayar"] | null
          nomor_antrian: string
          plat_motor: string
          sesi_id?: string | null
          status?: Database["public"]["Enums"]["status_tiket"]
          tahun_motor?: number | null
          tipe: Database["public"]["Enums"]["tipe_transaksi"]
          total_akhir?: number | null
          total_jasa?: number | null
          total_part?: number | null
          waktu_lunas?: string | null
          waktu_masuk?: string | null
          waktu_mulai?: string | null
          waktu_selesai?: string | null
        }
        Update: {
          cabang_id?: string | null
          cc_motor?: number | null
          customer_id?: string | null
          id?: string
          kasir_id?: string | null
          keluhan?: string | null
          mekanik_id?: string | null
          merk_motor?: string
          metode_bayar?: Database["public"]["Enums"]["metode_bayar"] | null
          nomor_antrian?: string
          plat_motor?: string
          sesi_id?: string | null
          status?: Database["public"]["Enums"]["status_tiket"]
          tahun_motor?: number | null
          tipe?: Database["public"]["Enums"]["tipe_transaksi"]
          total_akhir?: number | null
          total_jasa?: number | null
          total_part?: number | null
          waktu_lunas?: string | null
          waktu_masuk?: string | null
          waktu_mulai?: string | null
          waktu_selesai?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tiket_servis_cabang_id_fkey"
            columns: ["cabang_id"]
            isOneToOne: false
            referencedRelation: "cabang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tiket_servis_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tiket_servis_kasir_id_fkey"
            columns: ["kasir_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tiket_servis_mekanik_id_fkey"
            columns: ["mekanik_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tiket_servis_sesi_id_fkey"
            columns: ["sesi_id"]
            isOneToOne: false
            referencedRelation: "sesi_kasir"
            referencedColumns: ["id"]
          },
        ]
      }
      transaksi_takeaway: {
        Row: {
          cabang_id: string | null
          created_at: string | null
          customer_id: string | null
          id: string
          kasir_id: string | null
          metode_bayar: Database["public"]["Enums"]["metode_bayar"]
          nomor_struk: string
          sesi_id: string | null
          total: number
        }
        Insert: {
          cabang_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          kasir_id?: string | null
          metode_bayar: Database["public"]["Enums"]["metode_bayar"]
          nomor_struk: string
          sesi_id?: string | null
          total: number
        }
        Update: {
          cabang_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          kasir_id?: string | null
          metode_bayar?: Database["public"]["Enums"]["metode_bayar"]
          nomor_struk?: string
          sesi_id?: string | null
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "transaksi_takeaway_cabang_id_fkey"
            columns: ["cabang_id"]
            isOneToOne: false
            referencedRelation: "cabang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaksi_takeaway_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaksi_takeaway_kasir_id_fkey"
            columns: ["kasir_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaksi_takeaway_sesi_id_fkey"
            columns: ["sesi_id"]
            isOneToOne: false
            referencedRelation: "sesi_kasir"
            referencedColumns: ["id"]
          },
        ]
      }
      transaksi_takeaway_items: {
        Row: {
          barang_id: string
          harga_snapshot: number
          id: string
          qty: number
          subtotal: number | null
          transaksi_id: string
        }
        Insert: {
          barang_id: string
          harga_snapshot: number
          id?: string
          qty: number
          subtotal?: number | null
          transaksi_id: string
        }
        Update: {
          barang_id?: string
          harga_snapshot?: number
          id?: string
          qty?: number
          subtotal?: number | null
          transaksi_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaksi_takeaway_items_barang_id_fkey"
            columns: ["barang_id"]
            isOneToOne: false
            referencedRelation: "barang"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaksi_takeaway_items_transaksi_id_fkey"
            columns: ["transaksi_id"]
            isOneToOne: false
            referencedRelation: "transaksi_takeaway"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      metode_bayar: "tunai" | "qris" | "transfer"
      status_item: "reserved" | "committed"
      status_sesi: "aktif" | "ditutup"
      status_tiket: "menunggu" | "dikerjakan" | "selesai" | "lunas"
      tipe_transaksi: "service_part" | "jasa"
      user_role: "kasir" | "mekanik" | "owner"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      metode_bayar: ["tunai", "qris", "transfer"],
      status_item: ["reserved", "committed"],
      status_sesi: ["aktif", "ditutup"],
      status_tiket: ["menunggu", "dikerjakan", "selesai", "lunas"],
      tipe_transaksi: ["service_part", "jasa"],
      user_role: ["kasir", "mekanik", "owner"],
    },
  },
} as const
