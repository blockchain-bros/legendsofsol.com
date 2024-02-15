// lib/hellomoon.ts
import { RestClient } from "@hellomoon/api";

let restClient: RestClient;
export function getHelloMoon() {
  if (!restClient) {
    restClient = new RestClient(process.env.NEXT_HELLO_MOON_KEY!);
  }
  return restClient;
}