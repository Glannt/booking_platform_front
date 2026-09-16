export const queryKeys = {
  tours: {
    all: ["tours"] as const,
    lists: () => [...queryKeys.tours.all, "list"] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.tours.lists(), filters ?? {}] as const,
    details: () => [...queryKeys.tours.all, "detail"] as const,
    detail: (id: string | number) => [...queryKeys.tours.details(), String(id)] as const,
    categories: () => [...queryKeys.tours.all, "categories"] as const,
    policies: () => [...queryKeys.tours.all, "policies"] as const,
  },
  intercity: {
    all: ["intercity"] as const,
    routes: (filters?: Record<string, any>) => [...queryKeys.intercity.all, "routes", filters ?? {}] as const,
    routeDetail: (id: string | number) => [...queryKeys.intercity.all, "route", String(id)] as const,
    prices: (routeId?: number) => [...queryKeys.intercity.all, "prices", routeId] as const,
    sharedRoutes: (filters?: Record<string, any>) => [...queryKeys.intercity.all, "shared-routes", filters ?? {}] as const,
    offices: () => [...queryKeys.intercity.all, "offices"] as const,
  },
  selfDrive: {
    all: ["self-drive"] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.selfDrive.all, "list", filters ?? {}] as const,
    detail: (id: string | number) => [...queryKeys.selfDrive.all, "detail", String(id)] as const,
    policies: () => [...queryKeys.selfDrive.all, "policies"] as const,
  },
  fleet: {
    all: ["fleet"] as const,
    vehicles: (filters?: Record<string, any>) => [...queryKeys.fleet.all, "vehicles", filters ?? {}] as const,
    vehicleDetail: (id: string | number) => [...queryKeys.fleet.all, "vehicle", String(id)] as const,
    categories: () => [...queryKeys.fleet.all, "categories"] as const,
  },
  discounts: {
    all: ["discounts"] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.discounts.all, "list", filters ?? {}] as const,
    detail: (id: string | number) => [...queryKeys.discounts.all, "detail", String(id)] as const,
    active: (filters?: Record<string, any>) => [...queryKeys.discounts.all, "active", filters ?? {}] as const,
    myVouchers: () => [...queryKeys.discounts.all, "my-vouchers"] as const,
  },
  surcharges: {
    all: ["surcharges"] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.surcharges.all, "list", filters ?? {}] as const,
    detail: (id: string | number) => [...queryKeys.surcharges.all, "detail", String(id)] as const,
  },
  bookings: {
    all: ["bookings"] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.bookings.all, "list", filters ?? {}] as const,
    detail: (id: string | number) => [...queryKeys.bookings.all, "detail", String(id)] as const,
  },
  users: {
    all: ["users"] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.users.all, "list", filters ?? {}] as const,
    detail: (id: string | number) => [...queryKeys.users.all, "detail", String(id)] as const,
    roles: () => [...queryKeys.users.all, "roles"] as const,
  },
  sections: {
    all: ["sections"] as const,
    list: (pageRoute?: string, locale?: string) => [...queryKeys.sections.all, "list", pageRoute ?? "", locale ?? ""] as const,
  },
  currencies: {
    all: ["currencies"] as const,
    list: () => [...queryKeys.currencies.all, "list"] as const,
  },
};
