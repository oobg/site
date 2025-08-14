import { useEffect, useMemo, useRef, useState } from "react";

type PrimitiveType = "string" | "number" | "boolean" | "date" | "uuid";
type FieldType = PrimitiveType | "array";

interface BaseField {
    id: string;
    name: string;
    type: FieldType;
}

interface StringOpts { minLen: number; maxLen: number; }
interface NumberOpts { min: number; max: number; }
interface DateOpts { daysBackMin: number; daysBackMax: number; timezoneMode?: "local" | "utc"; timeZoneId?: string; }
interface ArrayOpts {
    itemType: Exclude<PrimitiveType, never>;
    lengthMin: number;
    lengthMax: number;
    itemStringOpts?: StringOpts;
    itemNumberOpts?: NumberOpts;
    itemDateOpts?: DateOpts;
}

type Field = BaseField & {
    stringOpts?: StringOpts;
    numberOpts?: NumberOpts;
    dateOpts?: DateOpts;
    arrayOpts?: ArrayOpts;
};

type FileFormat = "json" | "jsonl" | "csv";

const STORAGE_KEY = "jsonGen:v1";

function randInt(min: number, max: number) {
    const lo = Math.ceil(Math.min(min, max));
    const hi = Math.floor(Math.max(min, max));
    return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}
function randString(len: number) {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let s = "";
    for (let i = 0; i < len; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
    return s;
}

function formatLocalISO(date: Date): string {
    const pad = (n: number, w = 2) => String(n).padStart(w, "0");
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const hh = pad(date.getHours());
    const mm = pad(date.getMinutes());
    const ss = pad(date.getSeconds());
    const ms = pad(date.getMilliseconds(), 3);
    const tz = -date.getTimezoneOffset();
    const sign = tz >= 0 ? "+" : "-";
    const atz = Math.abs(tz);
    const th = pad(Math.floor(atz / 60));
    const tm = pad(atz % 60);
    return `${y}-${m}-${d}T${hh}:${mm}:${ss}.${ms}${sign}${th}:${tm}`;
}

function getTimeZoneOffsetMinutes(timeZone: string, date: Date): number {
    try {
        const fmt = new Intl.DateTimeFormat("en-US", {
            timeZone,
            hour12: false,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
        const parts = fmt.formatToParts(date);
        const lookup = Object.fromEntries(parts.map(p => [p.type, p.value]));
        const y = Number(lookup.year);
        const m = Number(lookup.month);
        const d = Number(lookup.day);
        const hh = Number(lookup.hour);
        const mm = Number(lookup.minute);
        const ss = Number(lookup.second);
        const zonedAsUTC = Date.UTC(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, ss || 0);
        const offsetMin = (zonedAsUTC - date.getTime()) / 60000;
        return Math.round(offsetMin);
    } catch {
        return -date.getTimezoneOffset();
    }
}

function formatOffsetLabel(mins: number): string {
    const sign = mins >= 0 ? "+" : "-";
    const abs = Math.abs(mins);
    const hh = String(Math.floor(abs / 60)).padStart(2, "0");
    const mm = String(abs % 60).padStart(2, "0");
    return `UTC${sign}${hh}:${mm}`;
}

function formatISOInTimeZone(date: Date, timeZone: string): string {
    if (timeZone === "UTC") return date.toISOString();
    const fmt = new Intl.DateTimeFormat("en-US", {
        timeZone,
        hour12: false,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
    const parts = fmt.formatToParts(date);
    const lookup = Object.fromEntries(parts.map(p => [p.type, p.value]));
    const y = Number(lookup.year);
    const m = Number(lookup.month);
    const d = Number(lookup.day);
    const hh = Number(lookup.hour);
    const mm = Number(lookup.minute);
    const ss = Number(lookup.second);
    const ms = date.getMilliseconds();
    const off = getTimeZoneOffsetMinutes(timeZone, date);
    const sign = off >= 0 ? "+" : "-";
    const ah = String(Math.floor(Math.abs(off) / 60)).padStart(2, "0");
    const am = String(Math.abs(off) % 60).padStart(2, "0");
    const pad = (n: number, w = 2) => String(n).padStart(w, "0");
    return `${y}-${pad(m)}-${pad(d)}T${pad(hh)}:${pad(mm)}:${pad(ss)}.${pad(ms, 3)}${sign}${ah}:${am}`;
}

function genPrimitive(t: PrimitiveType, opts?: { stringOpts?: StringOpts; numberOpts?: NumberOpts; dateOpts?: DateOpts; useUTC?: boolean; timeZoneId?: string }) {
    switch (t) {
        case "string": {
            const { minLen = 5, maxLen = 12 } = opts?.stringOpts || {};
            return randString(randInt(minLen, maxLen));
        }
        case "number": {
            const { min = 0, max = 10000 } = opts?.numberOpts || {};
            return randInt(min, max);
        }
        case "boolean":
            return Math.random() < 0.5;
        case "date": {
            const { daysBackMin = 0, daysBackMax = 365 } = opts?.dateOpts || {};
            const days = randInt(daysBackMin, daysBackMax);
            const d = new Date(Date.now() - days * 86400000);
            if (opts?.timeZoneId) return formatISOInTimeZone(d, opts.timeZoneId);
            return opts?.useUTC ? d.toISOString() : formatLocalISO(d);
        }
        case "uuid":
            return typeof globalThis.crypto?.randomUUID === "function"
                ? crypto.randomUUID()
                : `${randString(8)}-${randString(4)}-${randString(4)}-${randString(4)}-${randString(12)}`;
    }
}

// removed unused genValue

function toCSV(rows: Record<string, unknown>[]) {
    if (rows.length === 0) return "";
    const headers = Object.keys(rows[0]);
    const esc = (v: unknown) => {
        if (v === null || v === undefined) return "";
        const s = typeof v === "string" ? v : JSON.stringify(v);
        const needsQuote = /[",\n]/.test(s);
        const body = s.replace(/"/g, '""');
        return needsQuote ? `"${body}"` : body;
    };
    const lines = [
        headers.join(","),
        ...rows.map((r) => headers.map((h) => esc((r as any)[h])).join(",")),
    ];
    return lines.join("\n");
}

// 색상 매핑
const typeToColorClass: Record<string, string> = {
    key: "text-text-secondary",
    punctuation: "text-text-muted",
    string: "text-emerald-300",
    number: "text-sky-300",
    boolean: "text-fuchsia-300",
    date: "text-amber-300",
    uuid: "text-pink-300",
    unknown: "text-text-primary",
};

function buildFieldTypeMap(fields: Field[]): Record<string, FieldType | "date" | "uuid"> {
    const map: Record<string, FieldType | "date" | "uuid"> = {};
    for (const f of fields) {
        map[f.name.trim()] = f.type;
    }
    return map;
}

function decodeVisibleEscapes(s: string): string {
    // 문자열이 "[\n" 형태로 시작하면 첫 \n 제거
    const cleared = s.replace(/^\[\\n/, "[");
    const dec = cleared
        .replace(/\\r\\n/g, "\n")
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t");
    return dec;
}

function escapeString(str: string): string {
    return str
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"');
}

function renderColoredObjectRow(
    obj: Record<string, unknown>,
    fieldTypeMap: Record<string, FieldType | "date" | "uuid">,
    indent: number,
) {
    const pad = "  ".repeat(indent);
    const entries = Object.entries(obj);
    const lastIdx = entries.length - 1;
    return (
        <>
            <span className={typeToColorClass.punctuation}>{pad}{"{"}</span><br />
            {entries.map(([k, v], idx) => {
                const t = fieldTypeMap[k] || typeof v;
                const isLast = idx === lastIdx;
                if (Array.isArray(v)) {
                    // const itemType = (t === "array" ? (v.length > 0 ? typeof v[0] : "unknown") : "unknown");
                    return (
                        <span key={k}>
                            <span className={typeToColorClass.key}>{"  ".repeat(indent + 1)}"{k}"</span>
                            <span className={typeToColorClass.punctuation}>: [</span>
                            {v.map((iv, i) => {
                                const comma = i < (v as unknown[]).length - 1 ? "," : "";
                                const cls =
                                    typeof iv === "number" ? typeToColorClass.number :
                                        typeof iv === "boolean" ? typeToColorClass.boolean :
                                            typeToColorClass.string;
                                return (
                                    <span key={i}>
                                        <span className={cls}>{typeof iv === "string" ? `"${escapeString(String(iv))}"` : String(iv)}</span>
                                        <span className={typeToColorClass.punctuation}>{comma} </span>
                                    </span>
                                );
                            })}
                            <span className={typeToColorClass.punctuation}>{"]"}{isLast ? "" : ","}</span><br />
                        </span>
                    );
                }
                const cls = ((): string => {
                    if (t === "number" || typeof v === "number") return typeToColorClass.number;
                    if (t === "boolean" || typeof v === "boolean") return typeToColorClass.boolean;
                    if (t === "date") return typeToColorClass.date;
                    if (t === "uuid") return typeToColorClass.uuid;
                    return typeToColorClass.string;
                })();
                const valStr = typeof v === "string" ? `"${escapeString(v)}"` : String(v);
                return (
                    <span key={k}>
                        <span className={typeToColorClass.key}>{"  ".repeat(indent + 1)}"{k}"</span>
                        <span className={typeToColorClass.punctuation}>: </span>
                        <span className={cls}>{valStr}</span>
                        <span className={typeToColorClass.punctuation}>{isLast ? "" : ","}</span><br />
                    </span>
                );
            })}
            <span className={typeToColorClass.punctuation}>{pad}{"}"}</span>
        </>
    );
}

function ColoredJsonView({ rows, fields, colorize }: { rows: Record<string, unknown>[]; fields: Field[]; colorize: boolean }) {
    const fieldTypeMap = buildFieldTypeMap(fields);
    const cls = (k: keyof typeof typeToColorClass) => (colorize ? typeToColorClass[k] : "text-text-primary");
    return (
        <div className="font-mono whitespace-pre leading-6">
            <span className={cls("punctuation")}>[</span>
            <br />
            {rows.map((obj, idx) => (
                <span key={idx}>
                    {renderColoredObjectRow(obj, fieldTypeMap, 1)}
                    <span className={cls("punctuation")}>{idx < rows.length - 1 ? "," : ""}</span>
                    <br />
                </span>
            ))}
            <span className={cls("punctuation")}>]</span>
        </div>
    );
}

export function JsonGenerator() {
    const [fields, setFields] = useState<Field[]>([
        {
            id: "f1", name: "id", type: "uuid",
        },
        {
            id: "f2", name: "name", type: "string",
            stringOpts: { minLen: 5, maxLen: 12 },
        },
        {
            id: "f3", name: "active", type: "boolean",
        },
    ]);
    const [count, setCount] = useState(5);
    const [pretty, setPretty] = useState(true);
    const [format, setFormat] = useState<FileFormat>("json");
    const [output, setOutput] = useState<string>("");
    const [copied, setCopied] = useState(false);
    const [useUTC, setUseUTC] = useState(true);
    const [colorize, setColorize] = useState(true);

    const [schemaText, setSchemaText] = useState("");

    // 빠른 필드 추가 폼 상태
    const [newName, setNewName] = useState("field");
    const [newType, setNewType] = useState<FieldType>("string");
    const [nfStringMin, setNfStringMin] = useState(5);
    const [nfStringMax, setNfStringMax] = useState(12);
    const [nfNumberMin, setNfNumberMin] = useState(0);
    const [nfNumberMax, setNfNumberMax] = useState(10000);
    const [nfDateMin, setNfDateMin] = useState(0);
    const [nfDateMax, setNfDateMax] = useState(365);
    const [nfArrayType, setNfArrayType] = useState<PrimitiveType>("string");
    const [nfArrayLenMin, setNfArrayLenMin] = useState(1);
    const [nfArrayLenMax, setNfArrayLenMax] = useState(3);
    const [nfArrStrMin, setNfArrStrMin] = useState(3);
    const [nfArrStrMax, setNfArrStrMax] = useState(8);
    const [nfArrNumMin, setNfArrNumMin] = useState(0);
    const [nfArrNumMax, setNfArrNumMax] = useState(100);
    const [nfArrDateMin, setNfArrDateMin] = useState(0);
    const [nfArrDateMax, setNfArrDateMax] = useState(365);
    const [nfDateTZ, setNfDateTZ] = useState<string>(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
    const [nfArrDateTZ, setNfArrDateTZ] = useState<string>(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");

    const isValid = useMemo(() => {
        if (fields.length === 0) return false;
        const names = fields.map((f) => f.name.trim());
        if (names.some((n) => n.length === 0)) return false;
        const unique = new Set(names);
        return unique.size === names.length;
    }, [fields]);

    // 타임존 라벨 계산
    // reserved
    // const formatOffset = (mins: number) => {
    //     const sign = mins >= 0 ? "+" : "-";
    //     const abs = Math.abs(mins);
    //     const hh = Math.floor(abs / 60);
    //     const mm = abs % 60;
    //     return `${sign}${String(hh).padStart(2, "0")}${mm ? ":" + String(mm).padStart(2, "0") : ""}`;
    // };
    const localTzName = Intl.DateTimeFormat().resolvedOptions().timeZone || "Local";
    // const localTzLabel = `${formatOffsetLabel(localOffsetMinutes)} (${localTzName})`;
    const allTimeZones: string[] = typeof (Intl as any).supportedValuesOf === "function" ? (Intl as any).supportedValuesOf("timeZone") : [localTzName, "UTC"];
    const tzOptions = allTimeZones.map((tz) => {
        const off = tz === "UTC" ? 0 : getTimeZoneOffsetMinutes(tz, new Date());
        return { id: tz, label: `${formatOffsetLabel(off)} (${tz})` };
    }).sort((a, b) => a.label.localeCompare(b.label));

    // load
    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed?.fields) setFields(parsed.fields);
                if (typeof parsed?.count === "number") setCount(parsed.count);
                if (typeof parsed?.pretty === "boolean") setPretty(parsed.pretty);
                if (parsed?.format) setFormat(parsed.format);
                if (typeof parsed?.useUTC === "boolean") setUseUTC(parsed.useUTC);
            }
        } catch { void 0; }
    }, []);
    // save (debounced)
    const saveTimer = useRef<number | null>(null);
    useEffect(() => {
        if (saveTimer.current) window.clearTimeout(saveTimer.current);
        saveTimer.current = window.setTimeout(() => {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify({ fields, count, pretty, format, useUTC }));
            } catch { void 0; }
        }, 300);
        return () => {
            if (saveTimer.current) window.clearTimeout(saveTimer.current);
        };
    }, [fields, count, pretty, format, useUTC]);

    function addField() {
        const id = `f${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
        setFields((prev) => [
            ...prev,
            { id, name: `field${prev.length + 1}`, type: "string", stringOpts: { minLen: 5, maxLen: 12 } },
        ]);
    }
    function addFieldFromForm() {
        const name = newName.trim();
        if (!name) return;
        if (fields.some((f) => f.name.trim() === name)) return;
        const id = `f${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
        let field: Field;
        if (newType === "string") {
            field = { id, name, type: "string", stringOpts: { minLen: nfStringMin, maxLen: nfStringMax } };
        } else if (newType === "number") {
            field = { id, name, type: "number", numberOpts: { min: nfNumberMin, max: nfNumberMax } };
        } else if (newType === "date") {
            field = { id, name, type: "date", dateOpts: { daysBackMin: nfDateMin, daysBackMax: nfDateMax, timeZoneId: nfDateTZ } };
        } else if (newType === "array") {
            const arrOpts: ArrayOpts = {
                itemType: nfArrayType,
                lengthMin: nfArrayLenMin,
                lengthMax: nfArrayLenMax,
                itemStringOpts: nfArrayType === "string" ? { minLen: nfArrStrMin, maxLen: nfArrStrMax } : undefined,
                itemNumberOpts: nfArrayType === "number" ? { min: nfArrNumMin, max: nfArrNumMax } : undefined,
                itemDateOpts: nfArrayType === "date" ? { daysBackMin: nfArrDateMin, daysBackMax: nfArrDateMax, timeZoneId: nfArrDateTZ } : undefined,
            };
            field = { id, name, type: "array", arrayOpts: arrOpts };
        } else if (newType === "uuid" || newType === "boolean") {
            field = { id, name, type: newType } as Field;
        } else {
            field = { id, name, type: "string", stringOpts: { minLen: 5, maxLen: 12 } };
        }
        setFields((prev) => [...prev, field]);
    }
    function removeField(id: string) {
        setFields((prev) => prev.filter((f) => f.id !== id));
    }
    function updateField(id: string, patch: Partial<Field>) {
        setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
    }

    function applySchema() {
        try {
            const arr = JSON.parse(schemaText);
            if (!Array.isArray(arr)) throw new Error("배열 형태가 아닙니다.");
            const next: Field[] = arr.map((x: any, i: number) => ({
                id: `f${i + 1}`,
                name: String(x.name ?? `field${i + 1}`),
                type: (x.type ?? "string") as FieldType,
                stringOpts: x.stringOpts,
                numberOpts: x.numberOpts,
                dateOpts: x.dateOpts,
                arrayOpts: x.arrayOpts,
            }));
            setFields(next);
        } catch {
            setOutput("// 스키마 파싱 실패: JSON 배열 형태인지 확인해주세요.");
        }
    }

    function generate() {
        if (!isValid) {
            setOutput("// 필드 이름이 비어있거나 중복되었습니다.");
            return;
        }
        const safeCount = Math.max(0, Math.min(10000, count || 0));
        const rows = Array.from({ length: safeCount }, () => {
            const obj: Record<string, unknown> = {};
            for (const f of fields) {
                if (f.type === "array" && f.arrayOpts) {
                    const { itemType, lengthMin, lengthMax, itemStringOpts, itemNumberOpts, itemDateOpts } = f.arrayOpts;
                    const n = Math.max(0, randInt(lengthMin, lengthMax));
                    obj[f.name.trim()] = Array.from({ length: n }, () =>
                        genPrimitive(itemType, {
                            stringOpts: itemStringOpts,
                            numberOpts: itemNumberOpts,
                            dateOpts: itemDateOpts,
                            useUTC: itemDateOpts?.timezoneMode === "utc" ? true : itemDateOpts?.timezoneMode === "local" ? false : useUTC,
                            timeZoneId: itemDateOpts?.timezoneMode === "utc" ? "UTC" : undefined,
                        }),
                    );
                } else {
                    obj[f.name.trim()] = genPrimitive(f.type as PrimitiveType, {
                        stringOpts: f.stringOpts,
                        numberOpts: f.numberOpts,
                        dateOpts: f.dateOpts,
                        useUTC: f.dateOpts?.timeZoneId ? undefined : useUTC,
                        timeZoneId: f.dateOpts?.timeZoneId,
                    });
                }
            }
            return obj;
        });

        if (format === "csv") {
            setOutput(toCSV(rows));
        } else if (format === "jsonl") {
            setOutput(rows.map((r) => JSON.stringify(r)).join("\n"));
        } else {
            setOutput(pretty ? JSON.stringify(rows, null, 2) : JSON.stringify(rows));
        }
    }

    async function copy() {
        try {
            await navigator.clipboard.writeText(output);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
        } catch { void 0; }
    }

    function download() {
        const ext = format === "json" ? "json" : format === "jsonl" ? "jsonl" : "csv";
        const mime =
            format === "csv"
                ? "text/csv;charset=utf-8"
                : "application/json;charset=utf-8";
        const blob = new Blob([output || (format === "csv" ? "" : "[]")], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `data.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row gap-8">
                {/* 필드 정의 */}
                <div className="flex-1 space-y-5">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-text-secondary">필드 정의</span>
                        <button onClick={addField} className="text-sm px-4 py-2 rounded-xl bg-gradient-to-r from-accent to-accent-hover text-white shadow-lg hover:shadow-xl hover:brightness-105 active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50">
                            + 필드 추가
                        </button>
                    </div>

                    {/* 빠른 필드 추가 */}
                    <details className="glass border border-border rounded-xl p-4">
                        <summary className="cursor-pointer text-sm font-semibold">빠른 필드 추가</summary>
                        <div className="mt-3 grid grid-cols-12 gap-2 items-start">
                            <input
                                className="col-span-3 px-3 py-2 rounded-xl bg-background-secondary/70 border border-border/60 shadow-inner placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 transition"
                                placeholder="필드명"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                            />
                            <select
                                className="col-span-2 px-3 py-2 rounded-xl bg-background-secondary/70 border border-border/60 shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 transition"
                                value={newType}
                                onChange={(e) => setNewType(e.target.value as FieldType)}
                            >
                                <option value="string">string</option>
                                <option value="number">number</option>
                                <option value="boolean">boolean</option>
                                <option value="date">date</option>
                                <option value="uuid">uuid</option>
                                <option value="array">array</option>
                            </select>

                            {newType === "string" && (
                                <div className="col-span-6 grid grid-cols-2 gap-2">
                                    <label className="text-xs text-text-secondary">min
                                        <input type="number" className="w-full mt-1 px-2 py-1 rounded-xl bg-background-secondary/70 border border-border/60 shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                                            value={nfStringMin} onChange={(e) => setNfStringMin(Number(e.target.value))} />
                                    </label>
                                    <label className="text-xs text-text-secondary">max
                                        <input type="number" className="w-full mt-1 px-2 py-1 rounded-xl bg-background-secondary/70 border border-border/60 shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                                            value={nfStringMax} onChange={(e) => setNfStringMax(Number(e.target.value))} />
                                    </label>
                                </div>
                            )}
                            {newType === "number" && (
                                <div className="col-span-6 grid grid-cols-2 gap-2">
                                    <label className="text-xs text-text-secondary">min
                                        <input type="number" className="w-full mt-1 px-2 py-1 rounded-xl bg-background-secondary/70 border border-border/60 shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                                            value={nfNumberMin} onChange={(e) => setNfNumberMin(Number(e.target.value))} />
                                    </label>
                                    <label className="text-xs text-text-secondary">max
                                        <input type="number" className="w-full mt-1 px-2 py-1 rounded-xl bg-background-secondary/70 border border-border/60 shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                                            value={nfNumberMax} onChange={(e) => setNfNumberMax(Number(e.target.value))} />
                                    </label>
                                </div>
                            )}
                            {newType === "date" && (
                                <div className="col-span-7 grid grid-cols-7 gap-2 items-start">
                                    <div className="col-span-2 grid grid-cols-2 gap-2">
                                        <label className="text-xs text-text-secondary">days min
                                            <input type="number" className="w-full mt-1 px-2 py-1 rounded-xl bg-background-secondary/70 border border-border/60 shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                                                value={nfDateMin} onChange={(e) => setNfDateMin(Number(e.target.value))} />
                                        </label>
                                        <label className="text-xs text-text-secondary">days max
                                            <input type="number" className="w-full mt-1 px-2 py-1 rounded-xl bg-background-secondary/70 border border-border/60 shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                                                value={nfDateMax} onChange={(e) => setNfDateMax(Number(e.target.value))} />
                                        </label>
                                    </div>
                                    <select
                                        className="col-span-2 px-2 py-1 rounded-xl bg-background-secondary/70 border border-border/60 shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                                        value={nfDateTZ}
                                        onChange={(e) => setNfDateTZ(e.target.value)}
                                    >
                                        {tzOptions.map(opt => (
                                            <option key={opt.id} value={opt.id}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            {newType === "array" && (
                                <div className="col-span-7 grid grid-cols-7 gap-2 items-start">
                                    <select
                                        className="col-span-2 px-2 py-1 rounded-xl bg-background-secondary/70 border border-border/60 shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                                        value={nfArrayType}
                                        onChange={(e) => setNfArrayType(e.target.value as PrimitiveType)}
                                    >
                                        <option value="string">item: string</option>
                                        <option value="number">item: number</option>
                                        <option value="boolean">item: boolean</option>
                                        <option value="date">item: date</option>
                                        <option value="uuid">item: uuid</option>
                                    </select>
                                    <input type="number" className="col-span-1 px-2 py-1 rounded-xl bg-background-secondary/70 border border-border/60 shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40" value={nfArrayLenMin} onChange={(e) => setNfArrayLenMin(Number(e.target.value))} placeholder="len min" />
                                    <input type="number" className="col-span-1 px-2 py-1 rounded-xl bg-background-secondary/70 border border-border/60 shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40" value={nfArrayLenMax} onChange={(e) => setNfArrayLenMax(Number(e.target.value))} placeholder="len max" />

                                    {nfArrayType === "string" && (
                                        <div className="col-span-7 grid grid-cols-2 gap-2 mt-2">
                                            <input type="number" className="px-2 py-1 rounded-xl bg-background-secondary/70 border border-border/60 shadow-inner" value={nfArrStrMin} onChange={(e) => setNfArrStrMin(Number(e.target.value))} placeholder="item min" />
                                            <input type="number" className="px-2 py-1 rounded-xl bg-background-secondary/70 border border-border/60 shadow-inner" value={nfArrStrMax} onChange={(e) => setNfArrStrMax(Number(e.target.value))} placeholder="item max" />
                                        </div>
                                    )}
                                    {nfArrayType === "number" && (
                                        <div className="col-span-7 grid grid-cols-2 gap-2 mt-2">
                                            <input type="number" className="px-2 py-1 rounded-xl bg-background-secondary/70 border border-border/60 shadow-inner" value={nfArrNumMin} onChange={(e) => setNfArrNumMin(Number(e.target.value))} placeholder="item min" />
                                            <input type="number" className="px-2 py-1 rounded-xl bg-background-secondary/70 border border-border/60 shadow-inner" value={nfArrNumMax} onChange={(e) => setNfArrNumMax(Number(e.target.value))} placeholder="item max" />
                                        </div>
                                    )}
                                    {nfArrayType === "date" && (
                                        <div className="col-span-7 grid grid-cols-7 gap-2 mt-2 items-start">
                                            <input type="number" className="col-span-2 px-2 py-1 rounded-md bg-background-secondary border border-border" value={nfArrDateMin} onChange={(e) => setNfArrDateMin(Number(e.target.value))} placeholder="days min" />
                                            <input type="number" className="col-span-2 px-2 py-1 rounded-md bg-background-secondary border border-border" value={nfArrDateMax} onChange={(e) => setNfArrDateMax(Number(e.target.value))} placeholder="days max" />
                                            <select
                                                className="col-span-2 px-2 py-1 rounded-md bg-background-secondary border border-border focus:outline-none"
                                                value={nfArrDateTZ}
                                                onChange={(e) => setNfArrDateTZ(e.target.value)}
                                            >
                                                {tzOptions.map(opt => (
                                                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="col-span-12 md:col-span-1">
                                <button
                                    onClick={addFieldFromForm}
                                    className="w-full px-4 py-2 rounded-xl bg-gradient-to-r from-accent to-accent-hover text-white shadow-lg hover:shadow-xl hover:brightness-105 active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                                    title="필드 추가"
                                >
                                    추가
                                </button>
                            </div>
                        </div>
                    </details>

                    <div className="space-y-3">
                        {fields.map((f) => (
                            <div key={f.id} className="grid grid-cols-12 gap-2 items-start">
                                <input
                                    className="col-span-3 px-3 py-2 rounded-xl bg-background-secondary/70 border border-border/60 shadow-inner placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                                    placeholder="필드명 (예: email)"
                                    value={f.name}
                                    onChange={(e) => updateField(f.id, { name: e.target.value })}
                                />
                                <select
                                    className="col-span-2 px-3 py-2 rounded-xl bg-background-secondary/70 border border-border/60 shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                                    value={f.type}
                                    onChange={(e) => {
                                        const t = e.target.value as FieldType;
                                        if (t === "string" && !f.stringOpts) updateField(f.id, { type: t, stringOpts: { minLen: 5, maxLen: 12 }, numberOpts: undefined, dateOpts: undefined, arrayOpts: undefined });
                                        else if (t === "number" && !f.numberOpts) updateField(f.id, { type: t, numberOpts: { min: 0, max: 10000 }, stringOpts: undefined, dateOpts: undefined, arrayOpts: undefined });
                                        else if (t === "date" && !f.dateOpts) updateField(f.id, { type: t, dateOpts: { daysBackMin: 0, daysBackMax: 365 }, stringOpts: undefined, numberOpts: undefined, arrayOpts: undefined });
                                        else if (t === "array" && !f.arrayOpts) updateField(f.id, { type: t, arrayOpts: { itemType: "string", lengthMin: 1, lengthMax: 3, itemStringOpts: { minLen: 3, maxLen: 8 } }, stringOpts: undefined, numberOpts: undefined, dateOpts: undefined });
                                        else updateField(f.id, { type: t });
                                    }}
                                >
                                    <option value="string">string</option>
                                    <option value="number">number</option>
                                    <option value="boolean">boolean</option>
                                    <option value="date">date(ISO)</option>
                                    <option value="uuid">uuid</option>
                                    <option value="array">array</option>
                                </select>

                                {/* 타입별 옵션 */}
                                {f.type === "string" && (
                                    <div className="col-span-5 grid grid-cols-2 gap-2">
                                        <label className="text-xs text-text-secondary">min
                                            <input type="number" className="w-full mt-1 px-2 py-1 rounded-xl bg-background-secondary/70 border border-border/60 shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                                                value={f.stringOpts?.minLen ?? 5}
                                                onChange={(e) => updateField(f.id, { stringOpts: { minLen: Number(e.target.value), maxLen: f.stringOpts?.maxLen ?? 12 } })}
                                            />
                                        </label>
                                        <label className="text-xs text-text-secondary">max
                                            <input type="number" className="w-full mt-1 px-2 py-1 rounded-xl bg-background-secondary/70 border border-border/60 shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                                                value={f.stringOpts?.maxLen ?? 12}
                                                onChange={(e) => updateField(f.id, { stringOpts: { minLen: f.stringOpts?.minLen ?? 5, maxLen: Number(e.target.value) } })}
                                            />
                                        </label>
                                    </div>
                                )}

                                {f.type === "number" && (
                                    <div className="col-span-5 grid grid-cols-2 gap-2">
                                        <label className="text-xs text-text-secondary">min
                                            <input type="number" className="w-full mt-1 px-2 py-1 rounded-xl bg-background-secondary/70 border border-border/60 shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                                                value={f.numberOpts?.min ?? 0}
                                                onChange={(e) => updateField(f.id, { numberOpts: { min: Number(e.target.value), max: f.numberOpts?.max ?? 10000 } })}
                                            />
                                        </label>
                                        <label className="text-xs text-text-secondary">max
                                            <input type="number" className="w-full mt-1 px-2 py-1 rounded-xl bg-background-secondary/70 border border-border/60 shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                                                value={f.numberOpts?.max ?? 10000}
                                                onChange={(e) => updateField(f.id, { numberOpts: { min: f.numberOpts?.min ?? 0, max: Number(e.target.value) } })}
                                            />
                                        </label>
                                    </div>
                                )}

                                {f.type === "date" && (
                                    <div className="col-span-5 grid grid-cols-5 gap-2 items-start">
                                        <label className="col-span-2 text-xs text-text-secondary">days min
                                            <input type="number" className="w-full mt-1 px-2 py-1 rounded-xl bg-background-secondary/70 border border-border/60 shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                                                value={f.dateOpts?.daysBackMin ?? 0}
                                                onChange={(e) => updateField(f.id, { dateOpts: { ...(f.dateOpts || {}), daysBackMin: Number(e.target.value), daysBackMax: f.dateOpts?.daysBackMax ?? 365 } })}
                                            />
                                        </label>
                                        <label className="col-span-2 text-xs text-text-secondary">days max
                                            <input type="number" className="w-full mt-1 px-2 py-1 rounded-xl bg-background-secondary/70 border border-border/60 shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                                                value={f.dateOpts?.daysBackMax ?? 365}
                                                onChange={(e) => updateField(f.id, { dateOpts: { ...(f.dateOpts || {}), daysBackMin: f.dateOpts?.daysBackMin ?? 0, daysBackMax: Number(e.target.value) } })}
                                            />
                                        </label>
                                        <select
                                            className="col-span-1 px-2 py-1 rounded-xl bg-background-secondary/70 border border-border/60 shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                                            value={f.dateOpts?.timeZoneId ?? localTzName}
                                            onChange={(e) => updateField(f.id, { dateOpts: { ...(f.dateOpts || { daysBackMin: 0, daysBackMax: 365 }), timeZoneId: e.target.value } })}
                                        >
                                            {tzOptions.map(opt => (
                                                <option key={opt.id} value={opt.id}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {f.type === "array" && f.arrayOpts && (
                                    <div className="col-span-5 grid grid-cols-5 gap-2">
                                        <select
                                            className="col-span-2 px-2 py-1 rounded-xl bg-background-secondary/70 border border-border/60 shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                                            value={f.arrayOpts.itemType}
                                            onChange={(e) => updateField(f.id, { arrayOpts: { ...f.arrayOpts!, itemType: e.target.value as PrimitiveType } })}
                                        >
                                            <option value="string">item: string</option>
                                            <option value="number">item: number</option>
                                            <option value="boolean">item: boolean</option>
                                            <option value="date">item: date</option>
                                            <option value="uuid">item: uuid</option>
                                        </select>
                                        <input
                                            type="number"
                                            className="col-span-1 px-2 py-1 rounded-xl bg-background-secondary/70 border border-border/60 shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                                            value={f.arrayOpts.lengthMin}
                                            onChange={(e) => updateField(f.id, { arrayOpts: { ...f.arrayOpts!, lengthMin: Number(e.target.value) } })}
                                            placeholder="len min"
                                        />
                                        <input
                                            type="number"
                                            className="col-span-1 px-2 py-1 rounded-xl bg-background-secondary/70 border border-border/60 shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                                            value={f.arrayOpts.lengthMax}
                                            onChange={(e) => updateField(f.id, { arrayOpts: { ...f.arrayOpts!, lengthMax: Number(e.target.value) } })}
                                            placeholder="len max"
                                        />
                                        {/* 아이템 타입별 세부옵션(간단) */}
                                        {f.arrayOpts && f.arrayOpts.itemType === "string" && (
                                            <div className="col-span-5 grid grid-cols-2 gap-2 mt-2">
                                                <input type="number" className="px-2 py-1 rounded-xl bg-background-secondary/70 border border-border/60 shadow-inner"
                                                    value={f.arrayOpts!.itemStringOpts?.minLen ?? 3}
                                                    onChange={(e) => updateField(f.id, { arrayOpts: { ...f.arrayOpts!, itemStringOpts: { minLen: Number(e.target.value), maxLen: f.arrayOpts!.itemStringOpts?.maxLen ?? 8 } } })}
                                                    placeholder="item min"
                                                />
                                                <input type="number" className="px-2 py-1 rounded-xl bg-background-secondary/70 border border-border/60 shadow-inner"
                                                    value={f.arrayOpts!.itemStringOpts?.maxLen ?? 8}
                                                    onChange={(e) => updateField(f.id, { arrayOpts: { ...f.arrayOpts!, itemStringOpts: { minLen: f.arrayOpts!.itemStringOpts?.minLen ?? 3, maxLen: Number(e.target.value) } } })}
                                                    placeholder="item max"
                                                />
                                            </div>
                                        )}
                                        {f.arrayOpts && f.arrayOpts.itemType === "number" && (
                                            <div className="col-span-5 grid grid-cols-2 gap-2 mt-2">
                                                <input type="number" className="px-2 py-1 rounded-xl bg-background-secondary/70 border border-border/60 shadow-inner"
                                                    value={f.arrayOpts!.itemNumberOpts?.min ?? 0}
                                                    onChange={(e) => updateField(f.id, { arrayOpts: { ...f.arrayOpts!, itemNumberOpts: { min: Number(e.target.value), max: f.arrayOpts!.itemNumberOpts?.max ?? 100 } } })}
                                                    placeholder="item min"
                                                />
                                                <input type="number" className="px-2 py-1 rounded-xl bg-background-secondary/70 border border-border/60 shadow-inner"
                                                    value={f.arrayOpts!.itemNumberOpts?.max ?? 100}
                                                    onChange={(e) => updateField(f.id, { arrayOpts: { ...f.arrayOpts!, itemNumberOpts: { min: f.arrayOpts!.itemNumberOpts?.min ?? 0, max: Number(e.target.value) } } })}
                                                    placeholder="item max"
                                                />
                                            </div>
                                        )}
                                        {f.arrayOpts && f.arrayOpts.itemType === "date" && (
                                            <div className="col-span-5 grid grid-cols-5 gap-2 mt-2 items-start">
                                                <input type="number" className="col-span-2 px-2 py-1 rounded-xl bg-background-secondary/70 border border-border/60 shadow-inner"
                                                    value={f.arrayOpts!.itemDateOpts?.daysBackMin ?? 0}
                                                    onChange={(e) => updateField(f.id, { arrayOpts: { ...f.arrayOpts!, itemDateOpts: { ...(f.arrayOpts!.itemDateOpts || { daysBackMin: 0, daysBackMax: 365 }), daysBackMin: Number(e.target.value) } } })}
                                                    placeholder="days min"
                                                />
                                                <input type="number" className="col-span-2 px-2 py-1 rounded-xl bg-background-secondary/70 border border-border/60 shadow-inner"
                                                    value={f.arrayOpts!.itemDateOpts?.daysBackMax ?? 365}
                                                    onChange={(e) => updateField(f.id, { arrayOpts: { ...f.arrayOpts!, itemDateOpts: { ...(f.arrayOpts!.itemDateOpts || { daysBackMin: 0, daysBackMax: 365 }), daysBackMax: Number(e.target.value) } } })}
                                                    placeholder="days max"
                                                />
                                                <select
                                                    className="col-span-1 px-2 py-1 rounded-xl bg-background-secondary/70 border border-border/60 shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                                                    value={f.arrayOpts!.itemDateOpts?.timeZoneId ?? localTzName}
                                                    onChange={(e) => updateField(f.id, { arrayOpts: { ...f.arrayOpts!, itemDateOpts: { ...(f.arrayOpts!.itemDateOpts || { daysBackMin: 0, daysBackMax: 365 }), timeZoneId: e.target.value } } })}
                                                >
                                                    {tzOptions.map(opt => (
                                                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <button
                                    onClick={() => removeField(f.id)}
                                    className="col-span-1 px-3 py-2 rounded-xl border border-red-500/40 text-red-300 hover:bg-red-500/10 hover:shadow-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40"
                                    aria-label="remove field"
                                    title="삭제"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>

                    {!isValid && <p className="text-xs text-red-400">필드 이름은 비어있을 수 없고, 중복될 수 없습니다.</p>}

                    {/* 스키마 입력 모드 */}
                    <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-text-secondary">스키마 가져오기(JSON 배열)</summary>
                        <div className="mt-2 space-y-2">
                            <textarea
                                className="w-full h-40 px-3 py-2 rounded-md bg-background-secondary border border-border focus:outline-none"
                                placeholder='예) [{"name":"id","type":"uuid"},{"name":"tags","type":"array","arrayOpts":{"itemType":"string","lengthMin":1,"lengthMax":3}}]'
                                value={schemaText}
                                onChange={(e) => setSchemaText(e.target.value)}
                            />
                            <button onClick={applySchema} className="px-3 py-2 rounded-md border border-border hover:bg-background-secondary">스키마 적용</button>
                        </div>
                    </details>
                </div>

                {/* 컨트롤 패널 */}
                <div className="w-full md:w-80 space-y-4 md:sticky md:top-24 h-fit">
                    <label className="block">
                        <span className="text-sm text-text-secondary">생성 개수</span>
                        <input
                            type="number"
                            className="mt-1 w-full px-3 py-2 rounded-xl bg-background-secondary/70 border border-border/60 shadow-inner placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                            min={0}
                            max={10000}
                            value={count}
                            onChange={(e) => setCount(parseInt(e.target.value || "0"))}
                        />
                    </label>

                    <label className="block">
                        <span className="text-sm text-text-secondary">출력 포맷</span>
                        <select
                            className="mt-1 w-full px-3 py-2 rounded-xl bg-background-secondary/70 border border-border/60 shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                            value={format}
                            onChange={(e) => setFormat(e.target.value as FileFormat)}
                        >
                            <option value="json">JSON</option>
                            <option value="jsonl">JSONL</option>
                            <option value="csv">CSV</option>
                        </select>
                    </label>

                    <label className="inline-flex items-center gap-2">
                        <input type="checkbox" checked={pretty} onChange={(e) => setPretty(e.target.checked)} disabled={format !== "json"} />
                        <span className={`text-sm ${format !== "json" ? "text-text-muted" : ""}`}>Pretty print</span>
                    </label>

                    <label className="inline-flex items-center gap-2">
                        <input type="checkbox" checked={useUTC} onChange={(e) => setUseUTC(e.target.checked)} />
                        <span className="text-sm">날짜 UTC 타임존</span>
                    </label>

                    <div className="flex gap-2">
                        <button onClick={generate} className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-accent to-accent-hover text-white shadow-lg hover:shadow-xl hover:brightness-105 active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50">
                            생성
                        </button>
                        <button onClick={copy} className="px-3 py-2 rounded-xl border border-border/60 bg-background-secondary/60 hover:bg-background-secondary/80 hover:shadow-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30">
                            {copied ? "복사됨!" : "복사"}
                        </button>
                        <button onClick={download} className="px-3 py-2 rounded-xl border border-border/60 bg-background-secondary/60 hover:bg-background-secondary/80 hover:shadow-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30">
                            저장
                        </button>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="text-sm text-text-secondary">결과</div>
                    <label className="inline-flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={colorize} onChange={(e) => setColorize(e.target.checked)} />
                        <span>필드 타입 색상</span>
                    </label>
                </div>
                <div className="relative rounded-2xl p-[1px] bg-gradient-to-r from-accent/60 to-accent-hover/60">
                    <div className="w-full overflow-auto p-5 rounded-2xl bg-background-secondary/80 backdrop-blur border border-border text-sm">
                        {(() => {
                            if (!output) return <span className="text-text-muted">// 생성 버튼을 눌러 JSON을 만들어보세요.</span>;
                            if (!colorize) {
                                const display = decodeVisibleEscapes(output);
                                return <pre className="whitespace-pre-wrap break-words">{display}</pre>;
                            }
                            try {
                                if (format === "json") {
                                    const rows = JSON.parse(output) as Record<string, unknown>[];
                                    if (Array.isArray(rows)) {
                                        return <ColoredJsonView rows={rows} fields={fields} colorize={colorize} />;
                                    }
                                } else if (format === "jsonl") {
                                    const lines = output.split("\n").filter(Boolean);
                                    const rows = lines.map((l) => JSON.parse(l));
                                    return <ColoredJsonView rows={rows} fields={fields} colorize={colorize} />;
                                }
                            } catch {
                                const display = decodeVisibleEscapes(output);
                                return <pre className="whitespace-pre-wrap break-words">{display}</pre>;
                            }
                            const display = decodeVisibleEscapes(output);
                            return <pre className="whitespace-pre-wrap break-words">{display}</pre>;
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
}


