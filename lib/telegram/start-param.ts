// /start parametrlari (7-bo'lim): src_<manba> · bk_<booking_id> · test_<attempt_id>.
export type StartParam =
  | { kind: "src"; value: string }
  | { kind: "booking"; value: string }
  | { kind: "test"; value: string }
  | { kind: "none" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseStartParam(param: string | undefined): StartParam {
  if (!param) return { kind: "none" };
  if (param.startsWith("src_")) {
    const value = param
      .slice(4)
      .replace(/[^\w-]/g, "")
      .slice(0, 40);
    return value ? { kind: "src", value } : { kind: "none" };
  }
  if (param.startsWith("bk_") && UUID.test(param.slice(3))) return { kind: "booking", value: param.slice(3) };
  if (param.startsWith("test_") && UUID.test(param.slice(5))) return { kind: "test", value: param.slice(5) };
  return { kind: "none" };
}
