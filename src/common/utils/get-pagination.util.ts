

export const getPagination = (page: number, limit: number) => {
    const currentPage = Math.max(1, page || 1);
    const currentLimit = [10, 20, 25].includes(limit) ? limit : 10;

    return {
        page: currentPage,
        limit: currentLimit,
        skip: (currentPage - 1) * currentLimit,
    };
};