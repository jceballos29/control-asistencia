export class PaginationMeta {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
}

export class PaginatedResultDto<T> {
    data: T[];
    meta: PaginationMeta;
}