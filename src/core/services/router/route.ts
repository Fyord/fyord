export type Route = {
  href: string,
  path: string,
  routeParams: string[],
  queryParams: Map<string, string>,
  hashParams: string[]
};
