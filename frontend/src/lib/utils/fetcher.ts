import { http } from "./http";

export const fetcher = (url: string) => http.get(url).then(r => r.data);
