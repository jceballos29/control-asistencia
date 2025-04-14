import "@tanstack/react-table";
import { RowData } from "@tanstack/react-table";

declare module "@tanstack/react-table" {
  interface TableMeta<TData extends RowData> {
    handleDeleteClick?: (rowData: TData) => void;
    handleEditClick?: (rowData: TData) => void;
    handleViewDetailsClick?: (rowData: TData) => void;
  }
}
