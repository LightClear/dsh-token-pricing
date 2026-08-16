window.__ModuleLoader__.load({
	id: "dsh-token-pricing",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region ../../../vendor/cosmokit/src/misc.ts
		/** Return true when a value is `null` or `undefined`. */
		function isNullable(value) {
			return value === null || value === void 0;
		}
		/** Return true for non-array object values. */
		function isPlainObject(data) {
			return data && typeof data === "object" && !Array.isArray(data);
		}
		/** Filter object entries and return a new object. */
		function filterKeys(object, filter) {
			return Object.fromEntries(Object.entries(object).filter(([key, value]) => filter(key, value)));
		}
		/** Map object values while preserving the original key set. */
		function mapValues(object, transform) {
			return Object.fromEntries(Object.entries(object).map(([key, value]) => [key, transform(value, key)]));
		}
		/** Pick selected keys from an object, optionally including `undefined` values. */
		function pick(source, keys, forced) {
			if (!keys) return { ...source };
			const result = {};
			for (const key of keys) if (forced || source[key] !== void 0) result[key] = source[key];
			return result;
		}
		//#endregion
		//#region ../../../vendor/cosmokit/src/types.ts
		/** Test values using `instanceof` with a `toStringTag` fallback. */
		function is(type, value) {
			if (arguments.length === 1) return (value) => is(type, value);
			return type in globalThis && value instanceof globalThis[type] || Object.prototype.toString.call(value).slice(8, -1) === type;
		}
		function isArrayBufferLike(value) {
			return is("ArrayBuffer", value) || is("SharedArrayBuffer", value);
		}
		function isArrayBufferSource(value) {
			return isArrayBufferLike(value) || ArrayBuffer.isView(value);
		}
		let Binary;
		(function(_Binary) {
			_Binary.is = isArrayBufferLike;
			_Binary.isSource = isArrayBufferSource;
			function fromSource(source) {
				if (ArrayBuffer.isView(source)) return source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
				else return source;
			}
			_Binary.fromSource = fromSource;
			function toBase64(source) {
				source = fromSource(source);
				if (typeof Buffer !== "undefined") return Buffer.from(source).toString("base64");
				let binary = "";
				const bytes = new Uint8Array(source);
				for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
				return btoa(binary);
			}
			_Binary.toBase64 = toBase64;
			function fromBase64(source) {
				if (typeof Buffer !== "undefined") return fromSource(Buffer.from(source, "base64"));
				return Uint8Array.from(atob(source), (c) => c.charCodeAt(0));
			}
			_Binary.fromBase64 = fromBase64;
			function toHex(source) {
				source = fromSource(source);
				if (typeof Buffer !== "undefined") return Buffer.from(source).toString("hex");
				return Array.from(new Uint8Array(source), (byte) => byte.toString(16).padStart(2, "0")).join("");
			}
			_Binary.toHex = toHex;
			function fromHex(source) {
				if (typeof Buffer !== "undefined") return fromSource(Buffer.from(source, "hex"));
				const hex = source.length % 2 === 0 ? source : source.slice(0, source.length - 1);
				const buffer = [];
				for (let i = 0; i < hex.length; i += 2) buffer.push(parseInt(`${hex[i]}${hex[i + 1]}`, 16));
				return Uint8Array.from(buffer).buffer;
			}
			_Binary.fromHex = fromHex;
		})(Binary || (Binary = {}));
		Binary.fromBase64;
		Binary.toBase64;
		Binary.fromHex;
		Binary.toHex;
		/** Deep-clone common JavaScript values while preserving prototypes and cycles. */
		function clone(source, refs = /* @__PURE__ */ new Map()) {
			if (!source || typeof source !== "object") return source;
			if (is("Date", source)) return new Date(source.valueOf());
			if (is("RegExp", source)) return new RegExp(source.source, source.flags);
			if (isArrayBufferLike(source)) return source.slice(0);
			if (ArrayBuffer.isView(source)) return source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
			const cached = refs.get(source);
			if (cached) return cached;
			if (Array.isArray(source)) {
				const result = [];
				refs.set(source, result);
				source.forEach((value, index) => {
					result[index] = Reflect.apply(clone, null, [value, refs]);
				});
				return result;
			}
			const result = Object.create(Object.getPrototypeOf(source));
			refs.set(source, result);
			for (const key of Reflect.ownKeys(source)) {
				const descriptor = { ...Reflect.getOwnPropertyDescriptor(source, key) };
				if ("value" in descriptor) descriptor.value = Reflect.apply(clone, null, [descriptor.value, refs]);
				Reflect.defineProperty(result, key, descriptor);
			}
			return result;
		}
		/** Deeply compare arrays, dates, regexps, buffers, and plain object fields. */
		function deepEqual(a, b, strict) {
			if (a === b) return true;
			if (!strict && isNullable(a) && isNullable(b)) return true;
			if (typeof a !== typeof b) return false;
			if (typeof a !== "object") return false;
			if (!a || !b) return false;
			function check(test, then) {
				return test(a) ? test(b) ? then(a, b) : false : test(b) ? false : void 0;
			}
			return check(Array.isArray, (a, b) => a.length === b.length && a.every((item, index) => deepEqual(item, b[index]))) ?? check(is("Date"), (a, b) => a.valueOf() === b.valueOf()) ?? check(is("RegExp"), (a, b) => a.source === b.source && a.flags === b.flags) ?? check(isArrayBufferLike, (a, b) => {
				if (a.byteLength !== b.byteLength) return false;
				const viewA = new Uint8Array(a);
				const viewB = new Uint8Array(b);
				for (let i = 0; i < viewA.length; i++) if (viewA[i] !== viewB[i]) return false;
				return true;
			}) ?? Object.keys({
				...a,
				...b
			}).every((key) => deepEqual(a[key], b[key], strict));
		}
		//#endregion
		//#region ../../../vendor/cosmokit/src/time.ts
		let Time;
		(function(_Time) {
			_Time.millisecond = 1;
			const second = _Time.second = 1e3;
			const minute = _Time.minute = second * 60;
			const hour = _Time.hour = minute * 60;
			const day = _Time.day = hour * 24;
			const week = _Time.week = day * 7;
			let timezoneOffset = (/* @__PURE__ */ new Date()).getTimezoneOffset();
			function setTimezoneOffset(offset) {
				timezoneOffset = offset;
			}
			_Time.setTimezoneOffset = setTimezoneOffset;
			function getTimezoneOffset() {
				return timezoneOffset;
			}
			_Time.getTimezoneOffset = getTimezoneOffset;
			function getDateNumber(date = /* @__PURE__ */ new Date(), offset) {
				if (typeof date === "number") date = new Date(date);
				if (offset === void 0) offset = timezoneOffset;
				return Math.floor((date.valueOf() / minute - offset) / 1440);
			}
			_Time.getDateNumber = getDateNumber;
			function fromDateNumber(value, offset) {
				const date = new Date(value * day);
				if (offset === void 0) offset = timezoneOffset;
				return new Date(+date + offset * minute);
			}
			_Time.fromDateNumber = fromDateNumber;
			const numeric = /\d+(?:\.\d+)?/.source;
			const timeRegExp = new RegExp(`^${[
				"w(?:eek(?:s)?)?",
				"d(?:ay(?:s)?)?",
				"h(?:our(?:s)?)?",
				"m(?:in(?:ute)?(?:s)?)?",
				"s(?:ec(?:ond)?(?:s)?)?"
			].map((unit) => `(${numeric}${unit})?`).join("")}$`);
			function parseTime(source) {
				const capture = timeRegExp.exec(source);
				if (!capture) return 0;
				return (parseFloat(capture[1]) * week || 0) + (parseFloat(capture[2]) * day || 0) + (parseFloat(capture[3]) * hour || 0) + (parseFloat(capture[4]) * minute || 0) + (parseFloat(capture[5]) * second || 0);
			}
			_Time.parseTime = parseTime;
			function parseDate(date) {
				const parsed = parseTime(date);
				if (parsed) date = Date.now() + parsed;
				else if (/^\d{1,2}(:\d{1,2}){1,2}$/.test(date)) date = `${(/* @__PURE__ */ new Date()).toLocaleDateString()}-${date}`;
				else if (/^\d{1,2}-\d{1,2}-\d{1,2}(:\d{1,2}){1,2}$/.test(date)) date = `${(/* @__PURE__ */ new Date()).getFullYear()}-${date}`;
				return date ? new Date(date) : /* @__PURE__ */ new Date();
			}
			_Time.parseDate = parseDate;
			function format(ms) {
				const abs = Math.abs(ms);
				if (abs >= day - hour / 2) return Math.round(ms / day) + "d";
				else if (abs >= hour - minute / 2) return Math.round(ms / hour) + "h";
				else if (abs >= minute - second / 2) return Math.round(ms / minute) + "m";
				else if (abs >= second) return Math.round(ms / second) + "s";
				return ms + "ms";
			}
			_Time.format = format;
			function toDigits(source, length = 2) {
				return source.toString().padStart(length, "0");
			}
			_Time.toDigits = toDigits;
			function template(template, time = /* @__PURE__ */ new Date()) {
				return template.replace("yyyy", time.getFullYear().toString()).replace("yy", time.getFullYear().toString().slice(2)).replace("MM", toDigits(time.getMonth() + 1)).replace("dd", toDigits(time.getDate())).replace("hh", toDigits(time.getHours())).replace("mm", toDigits(time.getMinutes())).replace("ss", toDigits(time.getSeconds())).replace("SSS", toDigits(time.getMilliseconds(), 3));
			}
			_Time.template = template;
		})(Time || (Time = {}));
		//#endregion
		//#region ../../../vendor/schemastery/src/index.ts
		const kSchema = Symbol.for("schemastery");
		const kValidationError = Symbol.for("ValidationError");
		globalThis.__schemastery_index__ ??= 0;
		globalThis.__schemastery_refs__ = void 0;
		var ValidationError = class extends TypeError {
			options;
			name = "ValidationError";
			constructor(message, options) {
				let prefix = "$";
				for (const segment of options.path || []) if (typeof segment === "string") prefix += "." + segment;
				else if (typeof segment === "number") prefix += "[" + segment + "]";
				else if (typeof segment === "symbol") prefix += `[Symbol(${segment.toString()})]`;
				if (prefix.startsWith(".")) prefix = prefix.slice(1);
				super((prefix === "$" ? "" : `${prefix} `) + message);
				this.options = options;
			}
			static is(error) {
				return !!error?.[kValidationError];
			}
		};
		Object.defineProperty(ValidationError.prototype, kValidationError, { value: true });
		const Schema = function(options) {
			const schema = function(data, options = {}) {
				return Schema.resolve(data, schema, options)[0];
			};
			if (options.refs) {
				const refs = mapValues(options.refs, (options) => new Schema(options));
				const getRef = (uid) => refs[uid];
				for (const key in refs) {
					const options = refs[key];
					options.sKey = getRef(options.sKey);
					options.inner = getRef(options.inner);
					options.list = options.list && options.list.map(getRef);
					options.dict = options.dict && mapValues(options.dict, getRef);
				}
				return refs[options.uid];
			}
			Object.assign(schema, options);
			if (typeof schema.callback === "string") try {
				schema.callback = new Function("return " + schema.callback)();
			} catch {}
			Object.defineProperty(schema, "uid", { value: globalThis.__schemastery_index__++ });
			Object.setPrototypeOf(schema, Schema.prototype);
			schema.meta ||= {};
			schema.toString = schema.toString.bind(schema);
			return schema;
		};
		Schema.prototype = Object.create(Function.prototype);
		Schema.prototype[kSchema] = true;
		Object.defineProperty(Schema.prototype, "~standard", { get() {
			return {
				version: 1,
				vendor: "schemastery",
				validate: (value) => {
					try {
						return { value: Schema.resolve(value, this, {})[0] };
					} catch (error) {
						if (ValidationError.is(error)) return { issues: [{
							message: error.message,
							path: error.options.path
						}] };
						throw error;
					}
				}
			};
		} });
		Schema.ValidationError = ValidationError;
		Schema.prototype.toJSON = function toJSON() {
			if (globalThis.__schemastery_refs__) {
				globalThis.__schemastery_refs__[this.uid] ??= JSON.parse(JSON.stringify({ ...this }));
				return this.uid;
			}
			globalThis.__schemastery_refs__ = { [this.uid]: { ...this } };
			globalThis.__schemastery_refs__[this.uid] = JSON.parse(JSON.stringify({ ...this }));
			const result = {
				uid: this.uid,
				refs: globalThis.__schemastery_refs__
			};
			globalThis.__schemastery_refs__ = void 0;
			return result;
		};
		Schema.prototype.set = function set(key, value) {
			this.dict[key] = value;
			return this;
		};
		Schema.prototype.push = function push(value) {
			this.list.push(value);
			return this;
		};
		function mergeDesc(original, messages) {
			const result = typeof original === "string" ? { "": original } : { ...original };
			for (const locale in messages) {
				const value = messages[locale];
				if (value?.$description || value?.$desc) result[locale] = value.$description || value.$desc;
				else if (typeof value === "string") result[locale] = value;
			}
			return result;
		}
		function getInner(value) {
			return value?.$value ?? value?.$inner;
		}
		function extractKeys(data) {
			return filterKeys(data ?? {}, (key) => !key.startsWith("$"));
		}
		Schema.prototype.i18n = function i18n(messages) {
			const schema = Schema(this);
			const desc = mergeDesc(schema.meta.description, messages);
			if (Object.keys(desc).length) schema.meta.description = desc;
			if (schema.dict) schema.dict = mapValues(schema.dict, (inner, key) => {
				return inner.i18n(mapValues(messages, (data) => getInner(data)?.[key] ?? data?.[key]));
			});
			if (schema.list) schema.list = schema.list.map((inner, index) => {
				return inner.i18n(mapValues(messages, (data = {}) => {
					if (Array.isArray(getInner(data))) return getInner(data)[index];
					if (Array.isArray(data)) return data[index];
					return extractKeys(data);
				}));
			});
			if (schema.inner) schema.inner = schema.inner.i18n(mapValues(messages, (data) => {
				if (getInner(data)) return getInner(data);
				return extractKeys(data);
			}));
			if (schema.sKey) schema.sKey = schema.sKey.i18n(mapValues(messages, (data) => data?.$key));
			return schema;
		};
		Schema.prototype.extra = function extra(key, value) {
			const schema = Schema(this);
			schema.meta = {
				...schema.meta,
				[key]: value
			};
			return schema;
		};
		for (const key of [
			"required",
			"disabled",
			"collapse",
			"hidden",
			"loose"
		]) Object.assign(Schema.prototype, { [key](value = true) {
			const schema = Schema(this);
			schema.meta = {
				...schema.meta,
				[key]: value
			};
			return schema;
		} });
		Schema.prototype.deprecated = function deprecated() {
			const schema = Schema(this);
			schema.meta.badges ||= [];
			schema.meta.badges.push({
				text: "deprecated",
				type: "danger"
			});
			return schema;
		};
		Schema.prototype.experimental = function experimental() {
			const schema = Schema(this);
			schema.meta.badges ||= [];
			schema.meta.badges.push({
				text: "experimental",
				type: "warning"
			});
			return schema;
		};
		Schema.prototype.pattern = function pattern(regexp) {
			const schema = Schema(this);
			const pattern = pick(regexp, ["source", "flags"]);
			schema.meta = {
				...schema.meta,
				pattern
			};
			return schema;
		};
		Schema.prototype.simplify = function simplify(value) {
			if (deepEqual(value, this.meta.default, this.type === "dict")) return null;
			if (isNullable(value)) return value;
			if (this.type === "object" || this.type === "dict") {
				const result = {};
				for (const key in value) {
					const item = (this.type === "object" ? this.dict[key] : this.inner)?.simplify(value[key]);
					if (this.type === "dict" || !isNullable(item)) result[key] = item;
				}
				if (deepEqual(result, this.meta.default, this.type === "dict")) return null;
				return result;
			} else if (this.type === "array" || this.type === "tuple") {
				const result = [];
				value.forEach((value, index) => {
					const schema = this.type === "array" ? this.inner : this.list[index];
					const item = schema ? schema.simplify(value) : value;
					result.push(item);
				});
				return result;
			} else if (this.type === "intersect") {
				const result = {};
				for (const item of this.list) Object.assign(result, item.simplify(value));
				return result;
			} else if (this.type === "union") for (const schema of this.list) try {
				Schema.resolve(value, schema, {});
				return schema.simplify(value);
			} catch {}
			return value;
		};
		Schema.prototype.toString = function toString(inline) {
			return formatters[this.type]?.(this, inline) ?? `Schema<${this.type}>`;
		};
		Schema.prototype.role = function role(role, extra) {
			const schema = Schema(this);
			schema.meta = {
				...schema.meta,
				role,
				extra
			};
			return schema;
		};
		for (const key of [
			"default",
			"link",
			"comment",
			"description",
			"max",
			"min",
			"step"
		]) Object.assign(Schema.prototype, { [key](value) {
			const schema = Schema(this);
			schema.meta = {
				...schema.meta,
				[key]: value
			};
			return schema;
		} });
		const resolvers = {};
		Schema.extend = function extend(type, resolve) {
			resolvers[type] = resolve;
		};
		Schema.resolve = function resolve(data, schema, options = {}, strict = false) {
			if (!schema) return [data];
			if (options.ignore?.(data, schema)) return [data];
			if (isNullable(data) && schema.type !== "lazy") {
				if (schema.meta.required) throw new ValidationError(`missing required value`, options);
				let current = schema;
				let fallback = schema.meta.default;
				while (current?.type === "intersect" && isNullable(fallback)) {
					current = current.list[0];
					fallback = current?.meta.default;
				}
				if (isNullable(fallback)) return [data];
				data = clone(fallback);
			}
			const callback = resolvers[schema.type];
			if (!callback) throw new ValidationError(`unsupported type "${schema.type}"`, options);
			try {
				return callback(data, schema, options, strict);
			} catch (error) {
				if (!schema.meta.loose) throw error;
				return [schema.meta.default];
			}
		};
		Schema.from = function from(source) {
			if (isNullable(source)) return Schema.any();
			else if ([
				"string",
				"number",
				"boolean"
			].includes(typeof source)) return Schema.const(source).required();
			else if (source[kSchema]) return source;
			else if (typeof source === "function") switch (source) {
				case String: return Schema.string().required();
				case Number: return Schema.number().required();
				case Boolean: return Schema.boolean().required();
				case Function: return Schema.function().required();
				default: return Schema.is(source).required();
			}
			else throw new TypeError(`cannot infer schema from ${source}`);
		};
		Schema.lazy = function lazy(builder) {
			const toJSON = () => {
				if (!schema.inner[kSchema]) {
					schema.inner = schema.builder();
					schema.inner.meta = {
						...schema.meta,
						...schema.inner.meta
					};
				}
				return schema.inner.toJSON();
			};
			const schema = new Schema({
				type: "lazy",
				builder,
				inner: { toJSON }
			});
			return schema;
		};
		Schema.natural = function natural() {
			return Schema.number().step(1).min(0);
		};
		Schema.percent = function percent() {
			return Schema.number().step(.01).min(0).max(1).role("slider");
		};
		Schema.date = function date() {
			return Schema.union([Schema.is(Date), Schema.transform(Schema.string().role("datetime"), (value, options) => {
				const date = new Date(value);
				if (isNaN(+date)) throw new ValidationError(`invalid date "${value}"`, options);
				return date;
			}, true)]);
		};
		Schema.regExp = function regExp(flag = "") {
			return Schema.union([Schema.is(RegExp), Schema.transform(Schema.string().role("regexp", { flag }), (value, options) => {
				try {
					return new RegExp(value, flag);
				} catch (e) {
					throw new ValidationError(e.message, options);
				}
			}, true)]);
		};
		Schema.arrayBuffer = function arrayBuffer(encoding) {
			return Schema.union([
				Schema.is(ArrayBuffer),
				Schema.is(SharedArrayBuffer),
				Schema.transform(Schema.any(), (value, options) => {
					if (Binary.isSource(value)) return Binary.fromSource(value);
					throw new ValidationError(`expected ArrayBufferSource but got ${value}`, options);
				}, true),
				...encoding ? [Schema.transform(Schema.string(), (value, options) => {
					try {
						return encoding === "base64" ? Binary.fromBase64(value) : Binary.fromHex(value);
					} catch (e) {
						throw new ValidationError(e.message, options);
					}
				}, true)] : []
			]);
		};
		Schema.extend("lazy", (data, schema, options, strict) => {
			if (!schema.inner[kSchema]) {
				schema.inner = schema.builder();
				schema.inner.meta = {
					...schema.meta,
					...schema.inner.meta
				};
			}
			return Schema.resolve(data, schema.inner, options, strict);
		});
		Schema.extend("any", (data) => {
			return [data];
		});
		Schema.extend("never", (data, _, options) => {
			throw new ValidationError(`expected nullable but got ${data}`, options);
		});
		Schema.extend("const", (data, { value }, options) => {
			if (deepEqual(data, value)) return [value];
			throw new ValidationError(`expected ${value} but got ${data}`, options);
		});
		function checkWithinRange(data, meta, description, options, skipMin = false) {
			const { max = Infinity, min = -Infinity } = meta;
			if (data > max) throw new ValidationError(`expected ${description} <= ${max} but got ${data}`, options);
			if (data < min && !skipMin) throw new ValidationError(`expected ${description} >= ${min} but got ${data}`, options);
		}
		Schema.extend("string", (data, { meta }, options) => {
			if (typeof data !== "string") throw new ValidationError(`expected string but got ${data}`, options);
			if (meta.pattern) {
				const regexp = new RegExp(meta.pattern.source, meta.pattern.flags);
				if (!regexp.test(data)) throw new ValidationError(`expect string to match regexp ${regexp}`, options);
			}
			checkWithinRange(data.length, meta, "string length", options);
			return [data];
		});
		function decimalShift(data, digits) {
			const str = data.toString();
			if (str.includes("e")) return data * Math.pow(10, digits);
			const index = str.indexOf(".");
			if (index === -1) return data * Math.pow(10, digits);
			const frac = str.slice(index + 1);
			const integer = str.slice(0, index);
			if (frac.length <= digits) return +(integer + frac.padEnd(digits, "0"));
			return +(integer + frac.slice(0, digits) + "." + frac.slice(digits));
		}
		function isMultipleOf(data, min, step) {
			step = Math.abs(step);
			if (!/^\d+\.\d+$/.test(step.toString())) return (data - min) % step === 0;
			const index = step.toString().indexOf(".");
			const digits = step.toString().slice(index + 1).length;
			return Math.abs(decimalShift(data, digits) - decimalShift(min, digits)) % decimalShift(step, digits) === 0;
		}
		Schema.extend("number", (data, { meta }, options) => {
			if (typeof data !== "number") throw new ValidationError(`expected number but got ${data}`, options);
			checkWithinRange(data, meta, "number", options);
			const { step } = meta;
			if (step && !isMultipleOf(data, meta.min ?? 0, step)) throw new ValidationError(`expected number multiple of ${step} but got ${data}`, options);
			return [data];
		});
		Schema.extend("boolean", (data, _, options) => {
			if (typeof data === "boolean") return [data];
			throw new ValidationError(`expected boolean but got ${data}`, options);
		});
		Schema.extend("bitset", (data, { bits, meta }, options) => {
			let value = 0, keys = [];
			if (typeof data === "number") {
				value = data;
				for (const key in bits) if (data & bits[key]) keys.push(key);
			} else if (Array.isArray(data)) {
				keys = data;
				for (const key of keys) {
					if (typeof key !== "string") throw new ValidationError(`expected string but got ${key}`, options);
					if (key in bits) value |= bits[key];
				}
			} else throw new ValidationError(`expected number or array but got ${data}`, options);
			if (value === meta.default) return [value];
			return [value, keys];
		});
		Schema.extend("function", (data, _, options) => {
			if (typeof data === "function") return [data];
			throw new ValidationError(`expected function but got ${data}`, options);
		});
		Schema.extend("is", (data, { constructor }, options) => {
			if (typeof constructor === "function") {
				if (data instanceof constructor) return [data];
				throw new ValidationError(`expected ${constructor.name} but got ${data}`, options);
			} else {
				if (isNullable(data)) throw new ValidationError(`expected ${constructor} but got ${data}`, options);
				let prototype = Object.getPrototypeOf(data);
				while (prototype) {
					if (prototype.constructor?.name === constructor) return [data];
					prototype = Object.getPrototypeOf(prototype);
				}
				throw new ValidationError(`expected ${constructor} but got ${data}`, options);
			}
		});
		function property(data, key, schema, options) {
			try {
				const [value, adapted] = Schema.resolve(data[key], schema, {
					...options,
					path: [...options.path || [], key]
				});
				if (adapted !== void 0) data[key] = adapted;
				return value;
			} catch (e) {
				if (!options?.autofix) throw e;
				delete data[key];
				return schema.meta.default;
			}
		}
		Schema.extend("array", (data, { inner, meta }, options) => {
			if (!Array.isArray(data)) throw new ValidationError(`expected array but got ${data}`, options);
			checkWithinRange(data.length, meta, "array length", options, !isNullable(inner.meta.default));
			return [data.map((_, index) => property(data, index, inner, options))];
		});
		Schema.extend("dict", (data, { inner, sKey }, options, strict) => {
			if (!isPlainObject(data)) throw new ValidationError(`expected object but got ${data}`, options);
			const result = {};
			for (const key in data) {
				let rKey;
				try {
					rKey = Schema.resolve(key, sKey, options)[0];
				} catch (error) {
					if (strict) continue;
					throw error;
				}
				result[rKey] = property(data, key, inner, options);
				data[rKey] = data[key];
				if (key !== rKey) delete data[key];
			}
			return [result];
		});
		Schema.extend("tuple", (data, { list }, options, strict) => {
			if (!Array.isArray(data)) throw new ValidationError(`expected array but got ${data}`, options);
			const result = list.map((inner, index) => property(data, index, inner, options));
			if (strict) return [result];
			result.push(...data.slice(list.length));
			return [result];
		});
		function merge(result, data) {
			for (const key in data) {
				if (key in result) continue;
				result[key] = data[key];
			}
		}
		Schema.extend("object", (data, { dict }, options, strict) => {
			if (!isPlainObject(data)) throw new ValidationError(`expected object but got ${data}`, options);
			const result = {};
			for (const key in dict) {
				const value = property(data, key, dict[key], options);
				if (!isNullable(value) || key in data) result[key] = value;
			}
			if (!strict) merge(result, data);
			return [result];
		});
		Schema.extend("union", (data, { list, toString }, options, strict) => {
			const messages = [];
			for (const inner of list) try {
				return Schema.resolve(data, inner, options, strict);
			} catch (error) {
				messages.push(error);
			}
			throw new ValidationError(`expected ${toString()} but got ${JSON.stringify(data)}`, options);
		});
		Schema.extend("intersect", (data, { list, toString }, options, strict) => {
			if (!list.length) return [data];
			let result;
			for (const inner of list) {
				const value = Schema.resolve(data, inner, options, true)[0];
				if (isNullable(value)) continue;
				if (isNullable(result)) result = value;
				else if (typeof result !== typeof value) throw new ValidationError(`expected ${toString()} but got ${JSON.stringify(data)}`, options);
				else if (typeof value === "object") merge(result ??= {}, value);
				else if (result !== value) throw new ValidationError(`expected ${toString()} but got ${JSON.stringify(data)}`, options);
			}
			if (!strict && isPlainObject(data)) merge(result, data);
			return [result];
		});
		Schema.extend("transform", (data, { inner, callback, preserve }, options) => {
			const [result, adapted = data] = Schema.resolve(data, inner, options, true);
			if (preserve) return [callback(result)];
			else return [callback(result), callback(adapted)];
		});
		const formatters = {};
		function defineMethod(name, keys, format) {
			formatters[name] = format;
			Object.assign(Schema, { [name](...args) {
				const schema = new Schema({ type: name });
				keys.forEach((key, index) => {
					switch (key) {
						case "sKey":
							schema.sKey = args[index] ?? Schema.string();
							break;
						case "inner":
							schema.inner = Schema.from(args[index]);
							break;
						case "list":
							schema.list = args[index].map(Schema.from);
							break;
						case "dict":
							schema.dict = mapValues(args[index], Schema.from);
							break;
						case "bits":
							schema.bits = {};
							for (const key in args[index]) {
								if (typeof args[index][key] !== "number") continue;
								schema.bits[key] = args[index][key];
							}
							break;
						case "callback": {
							const callback = schema.callback = args[index];
							callback["toJSON"] ||= () => callback.toString();
							break;
						}
						case "constructor": {
							const constructor = schema.constructor = args[index];
							if (typeof constructor === "function") constructor["toJSON"] ||= () => constructor["name"];
							break;
						}
						default: schema[key] = args[index];
					}
				});
				if (name === "object" || name === "dict") schema.meta.default = {};
				else if (name === "array" || name === "tuple") schema.meta.default = [];
				else if (name === "bitset") schema.meta.default = 0;
				return schema;
			} });
		}
		defineMethod("is", ["constructor"], ({ constructor }) => {
			if (typeof constructor === "function") return constructor.name;
			else return constructor;
		});
		defineMethod("any", [], () => "any");
		defineMethod("never", [], () => "never");
		defineMethod("const", ["value"], ({ value }) => typeof value === "string" ? JSON.stringify(value) : value);
		defineMethod("string", [], () => "string");
		defineMethod("number", [], () => "number");
		defineMethod("boolean", [], () => "boolean");
		defineMethod("bitset", ["bits"], () => "bitset");
		defineMethod("function", [], () => "function");
		defineMethod("array", ["inner"], ({ inner }) => `${inner.toString(true)}[]`);
		defineMethod("dict", ["inner", "sKey"], ({ inner, sKey }) => `{ [key: ${sKey.toString()}]: ${inner.toString()} }`);
		defineMethod("tuple", ["list"], ({ list }) => `[${list.map((inner) => inner.toString()).join(", ")}]`);
		defineMethod("object", ["dict"], ({ dict }) => {
			if (Object.keys(dict).length === 0) return "{}";
			return `{ ${Object.entries(dict).map(([key, inner]) => {
				return `${key}${inner.meta.required ? "" : "?"}: ${inner.toString()}`;
			}).join(", ")} }`;
		});
		defineMethod("union", ["list"], ({ list }, inline) => {
			const result = list.map(({ toString: format }) => format()).join(" | ");
			return inline ? `(${result})` : result;
		});
		defineMethod("intersect", ["list"], ({ list }) => {
			return `${list.map((inner) => inner.toString(true)).join(" & ")}`;
		});
		defineMethod("transform", [
			"inner",
			"callback",
			"preserve"
		], ({ inner }, isInner) => inner.toString(isInner));
		//#endregion
		//#region src/settings.ts
		/**
		* Durable token-pricing section: per-provider/model USD rates per million
		* tokens, with an optional peak rate set over any number of time windows.
		* Shared by the Host schema (the `settings.register` wire envelope) and the
		* browser scope (the settingsScope value), so this module must stay
		* browser-safe.
		* @module @deepseek-ai/dsh-client-token-pricing/settings
		*/
		/** Settings namespace owned by the token-pricing plugin. */
		const TOKEN_PRICING_NAMESPACE = "token-pricing";
		/** Accepted peak-window timezone bases. */
		const PEAK_TIME_ZONES = ["local", "utc"];
		/** The single default peak window a freshly enabled entry starts from. */
		const DEFAULT_PEAK_WINDOW = {
			start: "09:00",
			end: "18:00"
		};
		/**
		* Schema for one provider/model rate entry. A schemastery transform folds
		* legacy single-window entries (`peakStart`/`peakEnd`) into `peakWindows`,
		* so stored configurations survive the schema change: a legacy entry keeps
		* its window, and an entry already carrying `peakWindows` passes through
		* unchanged (the transform also drops the legacy keys, so the first save
		* writes the new shape). The callback is deliberately self-contained — the
		* settings wire serializes it to the browser, where it is rehydrated with
		* no access to this module's bindings.
		*/
		const TokenPricingEntrySchema = Schema.transform(Schema.object({
			provider: Schema.string().default(""),
			model: Schema.string().default(""),
			inputMissPrice: Schema.number().min(0).default(0),
			inputHitPrice: Schema.number().min(0).default(0),
			outputPrice: Schema.number().min(0).default(0),
			peakEnabled: Schema.boolean().default(false),
			peakWindows: Schema.array(Schema.object({
				start: Schema.string().default("09:00"),
				end: Schema.string().default("18:00")
			})),
			peakTimeZone: Schema.union([...PEAK_TIME_ZONES]).default("local"),
			peakInputMissPrice: Schema.number().min(0).default(0),
			peakInputHitPrice: Schema.number().min(0).default(0),
			peakOutputPrice: Schema.number().min(0).default(0),
			peakStart: Schema.string(),
			peakEnd: Schema.string()
		}), (entry) => {
			const configured = entry.peakWindows ?? [];
			const windows = configured.length > 0 ? configured : entry.peakStart != null ? [{
				start: entry.peakStart,
				end: entry.peakEnd ?? "18:00"
			}] : [{
				start: "09:00",
				end: "18:00"
			}];
			return {
				provider: entry.provider,
				model: entry.model,
				inputMissPrice: entry.inputMissPrice,
				inputHitPrice: entry.inputHitPrice,
				outputPrice: entry.outputPrice,
				peakEnabled: entry.peakEnabled,
				peakWindows: windows,
				peakTimeZone: entry.peakTimeZone,
				peakInputMissPrice: entry.peakInputMissPrice,
				peakInputHitPrice: entry.peakInputHitPrice,
				peakOutputPrice: entry.peakOutputPrice
			};
		});
		Schema.object({ entries: Schema.array(TokenPricingEntrySchema).default([]) });
		//#endregion
		//#region src/client/pricing.ts
		/**
		* Minutes of day for one date under one timezone basis.
		* @param date - the instant to read.
		* @param timezone - whether to read local or UTC wall time.
		* @returns minutes since midnight in that timezone basis.
		*/
		function minutesOfDay(date, timezone) {
			return timezone === "utc" ? date.getUTCHours() * 60 + date.getUTCMinutes() : date.getHours() * 60 + date.getMinutes();
		}
		function toMinutes(hhmm) {
			const parts = hhmm.split(":");
			return Number(parts[0]) * 60 + Number(parts[1]);
		}
		/**
		* Whether a minute of day falls inside [start, end). An end earlier than the
		* start means the window wraps past midnight (22:00–08:00 covers 22:00–24:00
		* plus 00:00–08:00); a zero-length window covers the whole day.
		* @param start - window start, HH:MM.
		* @param end - window end, HH:MM.
		* @param nowMin - the minute of day to test.
		* @returns whether nowMin lies inside the window.
		*/
		function inWindow(start, end, nowMin) {
			const s = toMinutes(start);
			const e = toMinutes(end);
			if (s === e) return true;
			return s < e ? nowMin >= s && nowMin < e : nowMin >= s || nowMin < e;
		}
		/**
		* Whether the instant falls inside any configured peak window. An entry
		* declares several disjoint peak periods; a hit in one selects the peak
		* rate set.
		* @param windows - the entry's peak windows.
		* @param timeZone - timezone basis the windows are evaluated in.
		* @param now - the instant to test.
		* @returns whether the peak rate set applies at `now`.
		*/
		function inAnyPeakWindow(windows, timeZone, now) {
			const nowMin = minutesOfDay(now, timeZone);
			for (const window of windows) if (inWindow(window.start, window.end, nowMin)) return true;
			return false;
		}
		/**
		* First pricing entry whose model matches the current route and whose
		* provider, when non-empty, matches it too. No match means the route has no
		* configured price and the caller renders the unpriced state.
		* @param entries - configured pricing entries.
		* @param current - the route to match, or null when unknown.
		* @returns the matched entry, or undefined when none matches.
		*/
		function resolveEntry(entries, current) {
			if (current === null) return void 0;
			for (const entry of entries) {
				if (entry.model !== current.model) continue;
				if (entry.provider !== "" && entry.provider !== current.provider) continue;
				return entry;
			}
		}
		/**
		* Price one cumulative usage view under one entry, selecting the peak or
		* off-peak rate set from the current time when peak pricing is enabled.
		* Cache-write tokens bill at the cache-miss rate (DeepSeek semantics).
		* @param entry - the matched pricing entry.
		* @param usage - the usage view to price.
		* @param now - the instant whose tier applies.
		* @returns the cost figures.
		*/
		function computeCost(entry, usage, now) {
			const peak = entry.peakEnabled && inAnyPeakWindow(entry.peakWindows, entry.peakTimeZone, now);
			const miss = peak ? entry.peakInputMissPrice : entry.inputMissPrice;
			const hit = peak ? entry.peakInputHitPrice : entry.inputHitPrice;
			const out = peak ? entry.peakOutputPrice : entry.outputPrice;
			const inputTokens = usage.uncachedInputTokens + usage.cacheWriteTokens;
			const hitTokens = usage.cacheReadTokens;
			const outputTokens = usage.outputTokens;
			const inputCost = (inputTokens * miss + hitTokens * hit) / 1e6;
			const outputCost = outputTokens * out / 1e6;
			return {
				inputCost,
				outputCost,
				total: inputCost + outputCost,
				tier: entry.peakEnabled ? peak ? "peak" : "offpeak" : null,
				miss,
				hit,
				out,
				inputTokens,
				hitTokens,
				outputTokens
			};
		}
		/**
		* Compact USD amount: two decimals at or above $1, four decimals down to
		* $0.01, up to six significant decimals below it, always `$0` for zero.
		* @param value - the amount to format.
		* @returns the display string.
		*/
		function formatUsd(value) {
			if (!Number.isFinite(value) || value === 0) return "$0";
			if (value >= 1) return `$${value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}`;
			if (value >= .01) return `$${value.toFixed(4).replace(/0+$/, "").replace(/\.$/, "")}`;
			return `$${value.toFixed(6).replace(/0+$/, "").replace(/\.$/, "")}`;
		}
		/**
		* Compact token count: 517 / 12.2K / 1.2M (one decimal under three digits).
		* @param count - the token count to format.
		* @returns the display string.
		*/
		function formatTokens(count) {
			if (count < 1e3) return String(count);
			if (count < 1e6) return `${String(Math.round(count / 1e3))}K`;
			return `${String(Math.round(count / 1e6 * 10) / 10)}M`;
		}
		/**
		* The usage-bucket view of one recorded step, so the projection's flat step
		* fields feed the same {@link computeCost} math as the token-meter buckets.
		* @param step - the recorded usage step.
		* @returns the four disjoint buckets.
		*/
		function stepUsage(step) {
			return {
				uncachedInputTokens: step.inputTokens,
				cacheReadTokens: step.cacheReadTokens,
				cacheWriteTokens: step.cacheWriteTokens,
				outputTokens: step.outputTokens
			};
		}
		/**
		* Price one recorded step under the entry matched to its dispatch route,
		* with the peak/off-peak tier evaluated at the step's own time.
		* @param entries - configured pricing entries.
		* @param step - the recorded usage step.
		* @returns the matched entry and the cost, or undefined entry/cost.
		*/
		function priceStep(entries, step) {
			const entry = resolveEntry(entries, {
				provider: step.provider,
				model: step.model
			});
			if (entry === void 0) return {
				step,
				entry: void 0,
				cost: void 0
			};
			return {
				step,
				entry,
				cost: computeCost(entry, stepUsage(step), new Date(step.time))
			};
		}
		/**
		* Fold steps into per-route figures ordered by first appearance. Steps whose
		* route has no configured entry still carry token counts (costs stay 0), so
		* callers can surface the unpriced state instead of silently dropping it.
		* @param steps - the recorded usage steps.
		* @param entries - configured pricing entries.
		* @returns one row per distinct route.
		*/
		function foldModels(steps, entries) {
			const rows = [];
			const index = /* @__PURE__ */ new Map();
			for (const step of steps) {
				const key = `${step.provider}\u0000${step.model}`;
				let row = index.get(key);
				if (row === void 0) {
					row = {
						provider: step.provider,
						model: step.model,
						inputTokens: 0,
						outputTokens: 0,
						inputCost: 0,
						outputCost: 0,
						total: 0,
						entry: void 0,
						steps: 0
					};
					index.set(key, row);
					rows.push(row);
				}
				const priced = priceStep(entries, step);
				row.inputTokens += step.inputTokens + step.cacheReadTokens + step.cacheWriteTokens;
				row.outputTokens += step.outputTokens;
				row.steps += 1;
				if (priced.cost !== void 0) {
					row.entry = priced.entry;
					row.inputCost += priced.cost.inputCost;
					row.outputCost += priced.cost.outputCost;
					row.total += priced.cost.total;
				}
			}
			return rows;
		}
		/**
		* Whole-session per-model figures — the "按模型计价" view. Rows appear in
		* first-use order.
		* @param projection - the `tokenPricing` projection value.
		* @param entries - configured pricing entries.
		* @returns one row per distinct route used in the session.
		*/
		function aggregateByModel(projection, entries) {
			const steps = [];
			for (const turn of projection.turns) steps.push(...turn.steps);
			return foldModels(steps, entries);
		}
		/**
		* Whole-session per-turn figures — the "按轮计价" view. A turn that spans
		* several routes (a mid-turn model switch) carries one row per route, each
		* priced at its own steps' times. Turns without any usage-bearing step are
		* omitted.
		* @param projection - the `tokenPricing` projection value.
		* @param entries - configured pricing entries.
		* @returns one row per turn with usage, in turn order.
		*/
		function aggregateByTurn(projection, entries) {
			const turns = [];
			for (const turn of projection.turns) {
				const models = foldModels(turn.steps, entries);
				if (models.length > 0) turns.push({
					turn: turn.turn,
					startTime: turn.startTime,
					models
				});
			}
			return turns;
		}
		/**
		* Sum cost totals over per-route rows. Unpriced rows contribute zero, so the
		* result covers exactly the configured routes.
		* @param rows - per-route figures.
		* @returns the summed totals.
		*/
		function totalsOf(rows) {
			let inputCost = 0;
			let outputCost = 0;
			for (const row of rows) {
				inputCost += row.inputCost;
				outputCost += row.outputCost;
			}
			return {
				inputCost,
				outputCost,
				total: inputCost + outputCost
			};
		}
		//#endregion
		//#region \0dsh-css:D:\Softwares\deepseek-harness\packages\client\.tmp-token-pricing-export\src\client\PricingDock.module.css.mjs
		const css$2 = "._9bXjiq_root{text-align:center;max-width:var(--dsh-chat-content-width);box-sizing:border-box;width:100%;padding:0 calc(var(--dsh-composer-side-clearance) + 16px) 2px;color:var(--dsw-alias-label-secondary);white-space:nowrap;text-overflow:ellipsis;margin:0 auto;font-size:12px;line-height:20px;display:block;overflow:hidden}._9bXjiq_root span{margin:0 5px}._9bXjiq_total{color:var(--dsw-alias-label-primary)}";
		const tagId$2 = "dsh-token-pricing/PricingDock.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$2) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-token-pricing";
			tag.dataset.pluginCss = tagId$2;
			tag.textContent = css$2;
			document.head.appendChild(tag);
		}
		var PricingDock_module_css_default = {
			"root": "_9bXjiq_root",
			"total": "_9bXjiq_total"
		};
		//#endregion
		//#region src/client/PricingDock.tsx
		/**
		* PricingDock: the token-cost readout in the `conversation.composer.dock`
		* band, beside the shipped stats line. It shows the whole-session input /
		* output / total USD summed over every priced step of the `tokenPricing`
		* projection — no model name, no tier badge: the floating window owns the
		* per-turn and per-model detail. Each step is priced at its own time under
		* its dispatch route, so the readout matches the floating window's totals
		* exactly; a session whose usage has no configured price renders nothing.
		*/
		/**
		* Render the dock readout, or nothing while no usage is priced.
		* @param props - the projection read seat plus the bound pricing scope hook.
		* @returns the readout row, or null when there is nothing priced to show.
		*/
		function PricingDock({ useProjection, usePricing }) {
			const projection = useProjection("tokenPricing");
			const pricing = usePricing((snapshot) => snapshot);
			const rows = (0, react.useMemo)(() => projection === void 0 ? [] : aggregateByModel(projection, pricing?.value?.entries ?? []), [projection, pricing]);
			if (rows.length === 0 || !rows.some((row) => row.entry !== void 0)) return null;
			const totals = totalsOf(rows);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: PricingDock_module_css_default.root,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: ["输入 ", formatUsd(totals.inputCost)] }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: ["输出 ", formatUsd(totals.outputCost)] }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: PricingDock_module_css_default.total,
						children: ["总计 ", formatUsd(totals.total)]
					})
				]
			});
		}
		//#endregion
		//#region \0dsh-css:D:\Softwares\deepseek-harness\packages\client\.tmp-token-pricing-export\src\client\PricingFloat.module.css.mjs
		const css$1 = ".ogFf_q_root{pointer-events:auto;user-select:none;touch-action:none;background:var(--dsw-alias-brand-primary);width:44px;height:44px;color:var(--dsw-alias-label-primary-foreground);cursor:grab;border-radius:50%;justify-content:center;align-items:center;display:flex;position:fixed;bottom:16px;right:16px}.ogFf_q_root:active{cursor:grabbing}.ogFf_q_ballLabel{font-size:12px;font-weight:600;line-height:18px}.ogFf_q_panel{background:var(--dsw-alias-bg-layer-1);width:288px;height:auto;max-height:60vh;color:var(--dsw-alias-label-primary);border:1px solid var(--dsw-alias-border-l2);border-radius:12px;flex-direction:column;display:flex;overflow:hidden}.ogFf_q_header{border-bottom:1px solid var(--dsw-alias-border-l2);cursor:grab;user-select:none;touch-action:none;flex:none;align-items:center;gap:8px;padding:10px 12px;display:flex}.ogFf_q_header:active{cursor:grabbing}.ogFf_q_title{color:var(--dsw-alias-label-primary);font-size:13px;font-weight:500;line-height:20px}.ogFf_q_collapseButton{color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;width:20px;height:20px;margin-left:auto;padding:0;font-size:16px;line-height:20px}.ogFf_q_modes{flex:none;gap:6px;padding:8px 12px 0;display:flex}.ogFf_q_mode{border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border-radius:12px;height:24px;padding:0 10px;font-size:12px;line-height:18px}.ogFf_q_modeOn{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary-foreground)}.ogFf_q_body{flex-direction:column;flex:auto;gap:8px;min-height:40px;padding:8px 12px;display:flex;overflow-y:auto}.ogFf_q_empty{color:var(--dsw-alias-label-secondary);margin:0;font-size:12px;line-height:18px}.ogFf_q_turn{flex-direction:column;gap:4px;padding-bottom:4px;display:flex}.ogFf_q_turn+.ogFf_q_turn{border-top:1px dashed var(--dsw-alias-border-l2);padding-top:6px}.ogFf_q_turnHead{color:var(--dsw-alias-label-primary);align-items:baseline;gap:6px;font-size:12px;font-weight:500;line-height:18px;display:flex}.ogFf_q_turnTime{color:var(--dsw-alias-label-secondary);font-size:11px;font-weight:400;line-height:16px}.ogFf_q_row{align-items:baseline;gap:8px;font-size:12px;line-height:18px;display:flex}.ogFf_q_model{color:var(--dsw-alias-label-primary);overflow-wrap:anywhere;min-width:0}.ogFf_q_tokens{color:var(--dsw-alias-label-secondary);white-space:nowrap;margin-left:auto}.ogFf_q_cost{color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums;white-space:nowrap}.ogFf_q_unpriced{color:var(--dsw-alias-state-warn-primary);white-space:nowrap}.ogFf_q_footer{border-top:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);cursor:grab;user-select:none;touch-action:none;flex:none;align-items:center;gap:8px;padding:8px 12px;font-size:12px;line-height:18px;display:flex}.ogFf_q_footer:active{cursor:grabbing}.ogFf_q_total{font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-primary);margin-left:auto;font-weight:600}";
		const tagId$1 = "dsh-token-pricing/PricingFloat.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-token-pricing";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		var PricingFloat_module_css_default = {
			"mode": "ogFf_q_mode",
			"empty": "ogFf_q_empty",
			"root": "ogFf_q_root",
			"header": "ogFf_q_header",
			"turnHead": "ogFf_q_turnHead",
			"turn": "ogFf_q_turn",
			"modeOn": "ogFf_q_modeOn",
			"panel": "ogFf_q_panel",
			"unpriced": "ogFf_q_unpriced",
			"footer": "ogFf_q_footer",
			"body": "ogFf_q_body",
			"total": "ogFf_q_total",
			"turnTime": "ogFf_q_turnTime",
			"model": "ogFf_q_model",
			"ballLabel": "ogFf_q_ballLabel",
			"tokens": "ogFf_q_tokens",
			"title": "ogFf_q_title",
			"modes": "ogFf_q_modes",
			"collapseButton": "ogFf_q_collapseButton",
			"row": "ogFf_q_row",
			"cost": "ogFf_q_cost"
		};
		//#endregion
		//#region src/client/PricingFloat.tsx
		/**
		* PricingFloat: the collapsible, draggable token-cost window mounted on
		* `shell.overlay`. Collapsed it is a small cost ball (the whole-session
		* total); expanded it is a panel with two views over the current session's
		* `tokenPricing` projection — per-turn rows (each turn's routes, tokens,
		* and cost, with an unpriced hint where no entry matches) and per-model
		* aggregates. Drag zones are the ball, the panel header (top), and the
		* panel footer (bottom); presses on buttons inside a zone (the collapse
		* button) keep ordinary click semantics. The expanded panel anchors its
		* TOP edge: `top` derives from the measured height, so switching views or
		* growing content extends the bottom edge instead of moving the header.
		* All figures derive from the same pure pricing helpers as the dock, so
		* the three surfaces cannot disagree.
		*
		* The overlay seat is root-scoped, so the current session and its live
		* projection arrive through `useSessions` (list rows carry host-computed
		* `projectionValues`); the durable rates arrive through the bound pricing
		* scope hook.
		*/
		/** Frame margins the float keeps clear of the viewport edges, px. */
		const EDGE = 16;
		/** Pointer travel below which a press counts as a click, not a drag, px. */
		const DRAG_THRESHOLD = 3;
		/** Wall-clock HH:MM of a turn's start for the per-turn header. */
		function formatTurnTime(ms) {
			const date = new Date(ms);
			return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
		}
		/** Tokens line shared by both views: `输入 12.3K · 输出 1.2K`. */
		function tokenLine(inputTokens, outputTokens) {
			return `输入 ${formatTokens(inputTokens)} · 输出 ${formatTokens(outputTokens)}`;
		}
		/**
		* Render the floating cost window, or nothing while no conversation is open.
		* @param props - the sessions and pricing hooks.
		* @returns the ball or the expanded panel.
		*/
		function PricingFloat({ useSessions, usePricing }) {
			const projection = useSessions((state) => {
				const id = state.current;
				if (id === void 0) return void 0;
				return state.byId[id]?.projectionValues?.tokenPricing;
			});
			const hasSession = useSessions((state) => state.current !== void 0);
			const pricing = usePricing((snapshot) => snapshot);
			const view = (0, react.useMemo)(() => {
				const rows = projection === void 0 ? [] : aggregateByModel(projection, pricing?.value?.entries ?? []);
				return {
					rows,
					totals: totalsOf(rows)
				};
			}, [projection, pricing]);
			const [expanded, setExpanded] = (0, react.useState)(false);
			const [mode, setMode] = (0, react.useState)("turn");
			const [position, setPosition] = (0, react.useState)({
				x: 0,
				y: 0
			});
			const [panelHeight, setPanelHeight] = (0, react.useState)(0);
			const rootRef = (0, react.useRef)(null);
			const dragRef = (0, react.useRef)(null);
			const movedRef = (0, react.useRef)(false);
			(0, react.useLayoutEffect)(() => {
				if (!expanded) return;
				const el = rootRef.current;
				if (el === null) return;
				const sync = () => {
					const maxUp = Math.max(0, window.innerHeight - el.offsetHeight - EDGE * 2);
					const maxLeft = Math.max(0, window.innerWidth - el.offsetWidth - EDGE * 2);
					setPanelHeight(el.offsetHeight);
					setPosition((current) => ({
						x: Math.min(0, Math.max(-maxLeft, current.x)),
						y: Math.min(0, Math.max(-maxUp, current.y))
					}));
				};
				sync();
				if (typeof ResizeObserver === "undefined") return;
				const observer = new ResizeObserver(sync);
				observer.observe(el);
				return () => {
					observer.disconnect();
				};
			}, [expanded]);
			const onPointerDown = (event) => {
				const target = event.target;
				if (target instanceof Element && target.closest("button") !== null) return;
				if (typeof event.currentTarget.setPointerCapture === "function") event.currentTarget.setPointerCapture(event.pointerId);
				dragRef.current = {
					pointerId: event.pointerId,
					startX: event.clientX,
					startY: event.clientY,
					baseX: position.x,
					baseY: position.y
				};
				movedRef.current = false;
			};
			const onPointerMove = (event) => {
				const drag = dragRef.current;
				if (drag === null || drag.pointerId !== event.pointerId) return;
				const dx = event.clientX - drag.startX;
				const dy = event.clientY - drag.startY;
				if (Math.abs(dx) + Math.abs(dy) > DRAG_THRESHOLD) movedRef.current = true;
				const el = rootRef.current;
				if (el === null) return;
				const maxX = -Math.max(0, window.innerWidth - el.offsetWidth - EDGE * 2);
				const maxY = -Math.max(0, window.innerHeight - el.offsetHeight - EDGE * 2);
				setPosition({
					x: Math.min(0, Math.max(maxX, drag.baseX + dx)),
					y: Math.min(0, Math.max(maxY, drag.baseY + dy))
				});
			};
			const onPointerUp = (event) => {
				if (dragRef.current?.pointerId !== event.pointerId) return;
				dragRef.current = null;
			};
			const onBallClick = () => {
				if (movedRef.current) {
					movedRef.current = false;
					return;
				}
				setExpanded(true);
			};
			if (!hasSession) return null;
			if (!expanded) {
				const transform = `translate(${position.x}px, ${position.y}px)`;
				return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					ref: rootRef,
					className: PricingFloat_module_css_default.root,
					style: { transform },
					onPointerDown,
					onPointerMove,
					onPointerUp,
					onClick: onBallClick,
					role: "button",
					"aria-expanded": false,
					"aria-label": "展开 token 费用",
					title: "Token 费用",
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: PricingFloat_module_css_default.ballLabel,
						children: formatUsd(view.totals.total)
					})
				});
			}
			const turns = projection === void 0 ? [] : aggregateByTurn(projection, pricing?.value?.entries ?? []);
			const top = window.innerHeight - EDGE - panelHeight + position.y;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				ref: rootRef,
				className: `${PricingFloat_module_css_default.root} ${PricingFloat_module_css_default.panel}`,
				style: {
					top,
					bottom: "auto",
					transform: `translateX(${position.x}px)`
				},
				role: "dialog",
				"aria-label": "Token 费用",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: PricingFloat_module_css_default.header,
						onPointerDown,
						onPointerMove,
						onPointerUp,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: PricingFloat_module_css_default.title,
							children: "Token 费用"
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: PricingFloat_module_css_default.collapseButton,
							onClick: () => {
								setExpanded(false);
							},
							"aria-label": "折叠 token 费用",
							children: "×"
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: PricingFloat_module_css_default.modes,
						role: "tablist",
						"aria-label": "计价视图",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							role: "tab",
							"aria-selected": mode === "turn",
							className: mode === "turn" ? `${PricingFloat_module_css_default.mode} ${PricingFloat_module_css_default.modeOn}` : PricingFloat_module_css_default.mode,
							onClick: () => {
								setMode("turn");
							},
							children: "按轮计价"
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							role: "tab",
							"aria-selected": mode === "model",
							className: mode === "model" ? `${PricingFloat_module_css_default.mode} ${PricingFloat_module_css_default.modeOn}` : PricingFloat_module_css_default.mode,
							onClick: () => {
								setMode("model");
							},
							children: "按模型计价"
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: PricingFloat_module_css_default.body,
						children: mode === "turn" ? turns.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: PricingFloat_module_css_default.empty,
							children: "暂无 token 用量"
						}) : turns.map((turn) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: PricingFloat_module_css_default.turn,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: PricingFloat_module_css_default.turnHead,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [
									"第 ",
									turn.turn,
									" 轮"
								] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: PricingFloat_module_css_default.turnTime,
									children: formatTurnTime(turn.startTime)
								})]
							}), turn.models.map((model) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: PricingFloat_module_css_default.row,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: PricingFloat_module_css_default.model,
										children: model.model
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: PricingFloat_module_css_default.tokens,
										children: tokenLine(model.inputTokens, model.outputTokens)
									}),
									model.entry === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: PricingFloat_module_css_default.unpriced,
										children: "未设置计价"
									}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: PricingFloat_module_css_default.cost,
										children: formatUsd(model.total)
									})
								]
							}, `${model.provider}\u0000${model.model}`))]
						}, turn.turn)) : view.rows.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: PricingFloat_module_css_default.empty,
							children: "暂无 token 用量"
						}) : view.rows.map((row) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: PricingFloat_module_css_default.row,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: PricingFloat_module_css_default.model,
									children: row.model
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: PricingFloat_module_css_default.tokens,
									children: tokenLine(row.inputTokens, row.outputTokens)
								}),
								row.entry === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: PricingFloat_module_css_default.unpriced,
									children: "未设置计价"
								}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: PricingFloat_module_css_default.cost,
									children: formatUsd(row.total)
								})
							]
						}, `${row.provider}\u0000${row.model}`))
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: PricingFloat_module_css_default.footer,
						onPointerDown,
						onPointerMove,
						onPointerUp,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "总计" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: PricingFloat_module_css_default.total,
							children: formatUsd(view.totals.total)
						})]
					})
				]
			});
		}
		//#endregion
		//#region \0dsh-css:D:\Softwares\deepseek-harness\packages\client\.tmp-token-pricing-export\src\client\PricingSection.module.css.mjs
		const css = ".bghAUa_section{max-width:720px;color:var(--dsw-alias-label-primary);flex-direction:column;gap:12px;display:flex}.bghAUa_title{color:var(--dsw-alias-label-primary);margin:0;font-size:16px;font-weight:500;line-height:24px}.bghAUa_intro{color:var(--dsw-alias-label-secondary);margin:0;font-size:14px;line-height:22px}.bghAUa_saved{color:var(--dsw-alias-state-success-primary);margin:0;font-size:12px;line-height:18px}.bghAUa_empty{color:var(--dsw-alias-label-secondary);margin:0;font-size:12px;line-height:18px}.bghAUa_rows{flex-direction:column;gap:8px;margin:12px 0 0;padding:0;list-style:none;display:flex}.bghAUa_rowCard{border:1px solid var(--dsw-alias-border-l2);border-radius:12px;flex-direction:column;gap:12px;padding:12px 14px;display:flex}.bghAUa_rowHead{align-items:center;gap:10px;display:flex}.bghAUa_rowIdentity{flex-wrap:wrap;align-items:center;gap:6px;min-width:0;display:inline-flex}.bghAUa_rowName{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:500;line-height:22px}.bghAUa_rowTag{border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);border-radius:4px;flex:none;padding:1px 6px;font-size:11px;line-height:16px}.bghAUa_rowCount{color:var(--dsw-alias-label-secondary);white-space:nowrap;margin-left:auto;font-size:12px;line-height:18px}.bghAUa_modelList{flex-direction:column;gap:8px;display:flex}.bghAUa_modelEntry{border:1px solid var(--dsw-alias-border-l2);border-radius:8px;flex-direction:column;gap:8px;padding:6px;display:flex}.bghAUa_modelRow{align-items:center;gap:8px;min-width:0;display:flex}.bghAUa_modelId{font-family:var(--ds-font-family-code);color:var(--dsw-alias-label-primary);overflow-wrap:anywhere;font-size:13px;line-height:20px}.bghAUa_modelName{color:var(--dsw-alias-label-secondary);text-overflow:ellipsis;white-space:nowrap;font-size:12px;line-height:18px;overflow:hidden}.bghAUa_dot{background:var(--dsw-alias-border-l2);border-radius:50%;flex:none;width:8px;height:8px}.bghAUa_dotOn{background:var(--dsw-alias-state-success-primary)}.bghAUa_editor{background:var(--dsw-alias-bg-layer-2);border-radius:8px;flex-direction:column;gap:10px;padding:10px 12px;display:flex}.bghAUa_editorGrid{grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px 10px;display:grid}.bghAUa_field{color:var(--dsw-alias-label-secondary);flex-direction:column;gap:4px;font-size:12px;line-height:18px;display:flex}.bghAUa_field input,.bghAUa_field select{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);width:100%;height:32px;font:inherit;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);border-radius:8px;padding:0 10px;font-size:14px;line-height:22px}.bghAUa_field input:focus,.bghAUa_field select:focus{border-color:var(--dsw-alias-brand-primary);outline:none}.bghAUa_field select{cursor:pointer}.bghAUa_peakBlock{border-top:1px dashed var(--dsw-alias-border-l2);flex-direction:column;gap:10px;padding-top:10px;display:flex}.bghAUa_windowRow{align-items:flex-end;gap:8px;display:flex}.bghAUa_windowRow .bghAUa_field{flex:1;min-width:0}.bghAUa_check{color:var(--dsw-alias-label-primary);align-items:center;gap:6px;font-size:13px;line-height:20px;display:flex}.bghAUa_editorActions{justify-content:flex-end;display:flex}.bghAUa_actions{align-items:center;gap:10px;display:flex}.bghAUa_secondaryButton,.bghAUa_primaryButton,.bghAUa_dangerButton{box-sizing:border-box;height:28px;font:inherit;cursor:pointer;border-radius:14px;justify-content:center;align-items:center;gap:4px;padding:0 10px;font-size:12px;line-height:18px;display:inline-flex}.bghAUa_secondaryButton{border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary);background:0 0}.bghAUa_primaryButton{background:var(--dsw-alias-brand-primary);height:36px;color:var(--dsw-alias-label-primary-foreground);border:none;border-radius:18px;padding:0 14px;font-size:14px;line-height:22px}.bghAUa_dangerButton{color:var(--dsw-alias-state-error-primary);background:0 0;border:none}.bghAUa_secondaryButton:hover:not(:disabled),.bghAUa_dangerButton:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2)}.bghAUa_primaryButton:disabled,.bghAUa_secondaryButton:disabled,.bghAUa_dangerButton:disabled{opacity:.4;cursor:default}.bghAUa_status{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}.bghAUa_statusError{color:var(--dsw-alias-state-error-primary)}";
		const tagId = "dsh-token-pricing/PricingSection.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-token-pricing";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var PricingSection_module_css_default = {
			"dotOn": "bghAUa_dotOn",
			"dangerButton": "bghAUa_dangerButton",
			"rowCard": "bghAUa_rowCard",
			"rowHead": "bghAUa_rowHead",
			"modelRow": "bghAUa_modelRow",
			"primaryButton": "bghAUa_primaryButton",
			"modelList": "bghAUa_modelList",
			"rowCount": "bghAUa_rowCount",
			"secondaryButton": "bghAUa_secondaryButton",
			"rowTag": "bghAUa_rowTag",
			"title": "bghAUa_title",
			"rowName": "bghAUa_rowName",
			"status": "bghAUa_status",
			"statusError": "bghAUa_statusError",
			"editorActions": "bghAUa_editorActions",
			"rowIdentity": "bghAUa_rowIdentity",
			"windowRow": "bghAUa_windowRow",
			"intro": "bghAUa_intro",
			"editorGrid": "bghAUa_editorGrid",
			"editor": "bghAUa_editor",
			"field": "bghAUa_field",
			"empty": "bghAUa_empty",
			"modelName": "bghAUa_modelName",
			"check": "bghAUa_check",
			"dot": "bghAUa_dot",
			"rows": "bghAUa_rows",
			"peakBlock": "bghAUa_peakBlock",
			"saved": "bghAUa_saved",
			"section": "bghAUa_section",
			"modelId": "bghAUa_modelId",
			"modelEntry": "bghAUa_modelEntry",
			"actions": "bghAUa_actions"
		};
		//#endregion
		//#region src/client/PricingSection.tsx
		/**
		* PricingSection: the "模型定价" settings page, styled after the Models
		* settings page. One card per provider route (catalog from `llm.models`),
		* each listing its models with a configured/unconfigured dot and an editor
		* for the three base rates plus the optional peak-hour rate set. Drafts live
		* in component state; 保存配置 writes the whole entries list through the
		* settings scope, and the scope refresh re-syncs the form with host truth.
		*/
		/** Draft entry for a route with no stored configuration yet. */
		function defaultEntry(route) {
			return {
				provider: route.provider,
				model: route.model,
				inputMissPrice: 0,
				inputHitPrice: 0,
				outputPrice: 0,
				peakEnabled: false,
				peakWindows: [{ ...DEFAULT_PEAK_WINDOW }],
				peakTimeZone: "local",
				peakInputMissPrice: 0,
				peakInputHitPrice: 0,
				peakOutputPrice: 0
			};
		}
		/** Draft key: provider and model joined by a NUL (neither may contain it). */
		function keyOf(provider, model) {
			return `${provider}\u0000${model}`;
		}
		function keyParts(key) {
			const [provider, model] = key.split("\0");
			return {
				provider: provider ?? "",
				model: model ?? ""
			};
		}
		function entriesOf(drafts) {
			const entries = [];
			for (const [key, entry] of drafts.entries()) {
				const parts = keyParts(key);
				entries.push({
					...entry,
					provider: parts.provider,
					model: parts.model
				});
			}
			return entries;
		}
		/**
		* One numeric price field. The input is a decimal-keyboard text field with
		* local string state, so intermediate typing ("0.") survives instead of being
		* re-serialized away by a controlled number input; only parses ≥ 0 commit to
		* the draft, and blur normalizes the text back to the committed value.
		*/
		function PriceField({ label, value, onCommit }) {
			const [text, setText] = (0, react.useState)(String(value));
			(0, react.useEffect)(() => {
				setText(String(value));
			}, [value]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
				className: PricingSection_module_css_default.field,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: label }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
					type: "text",
					inputMode: "decimal",
					value: text,
					onChange: (event) => {
						const raw = event.target.value;
						setText(raw);
						const parsed = Number(raw);
						if (raw.trim() !== "" && Number.isFinite(parsed) && parsed >= 0) onCommit(parsed);
					},
					onBlur: () => {
						setText(String(value));
					}
				})]
			});
		}
		/**
		* Render the pricing settings page.
		* @param props - the injected face plus the bound scope hook.
		* @returns the section content.
		*/
		function PricingSection({ usePricing, api, saveEntries }) {
			const pricing = usePricing((snapshot) => snapshot);
			const [catalog, setCatalog] = (0, react.useState)(null);
			const [catalogError, setCatalogError] = (0, react.useState)(false);
			const [reloadKey, setReloadKey] = (0, react.useState)(0);
			const [drafts, setDrafts] = (0, react.useState)(null);
			const [editing, setEditing] = (0, react.useState)(null);
			const [status, setStatus] = (0, react.useState)("idle");
			(0, react.useEffect)(() => {
				let alive = true;
				api.llm.models({}).then((response) => {
					if (!alive) return;
					if (!response.result.ok) {
						setCatalogError(true);
						return;
					}
					setCatalog({
						groups: response.result.value.groups.map((group) => ({
							id: group.id,
							name: group.name,
							models: group.models.map((model) => ({
								id: model.id,
								name: model.name
							}))
						})),
						failures: response.result.value.failures
					});
					setCatalogError(false);
				}).catch(() => {
					if (alive) setCatalogError(true);
				});
				return () => {
					alive = false;
				};
			}, [api, reloadKey]);
			(0, react.useEffect)(() => {
				if (drafts !== null || pricing === void 0 || pricing.status !== "ready") return;
				const map = /* @__PURE__ */ new Map();
				for (const entry of pricing.value?.entries ?? []) map.set(keyOf(entry.provider, entry.model), { ...entry });
				setDrafts(map);
			}, [drafts, pricing]);
			const patchDraft = (key, field, value) => {
				setDrafts((map) => {
					if (map === null) return map;
					const next = new Map(map);
					const current = next.get(key) ?? defaultEntry(keyParts(key));
					next.set(key, {
						...current,
						[field]: value
					});
					return next;
				});
			};
			/** Apply one transformation to a draft's peak-window list. */
			const updateWindows = (key, update) => {
				setDrafts((map) => {
					if (map === null) return map;
					const next = new Map(map);
					const current = next.get(key) ?? defaultEntry(keyParts(key));
					next.set(key, {
						...current,
						peakWindows: update(current.peakWindows)
					});
					return next;
				});
			};
			const removeDraft = (key) => {
				setDrafts((map) => {
					if (map === null) return map;
					const next = new Map(map);
					next.delete(key);
					return next;
				});
				setEditing(null);
			};
			const save = async () => {
				if (drafts === null) return;
				setStatus("saving");
				const submitted = entriesOf(drafts);
				const fresh = await saveEntries(submitted);
				const landed = fresh.value !== void 0 && fresh.value.entries.length === submitted.length && fresh.value.entries.every((entry, index) => entry.model === submitted[index]?.model && entry.provider === submitted[index]?.provider);
				setDrafts((map) => {
					if (map === null) return map;
					const next = /* @__PURE__ */ new Map();
					for (const entry of fresh.value?.entries ?? []) next.set(keyOf(entry.provider, entry.model), { ...entry });
					return next;
				});
				setStatus(landed ? "saved" : "error");
			};
			if (catalog === null || catalogError) return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: PricingSection_module_css_default.section,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
						className: PricingSection_module_css_default.title,
						children: "模型定价"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: PricingSection_module_css_default.intro,
						children: catalogError ? "模型目录加载失败。" : "加载中…"
					}),
					catalogError && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: PricingSection_module_css_default.secondaryButton,
						onClick: () => {
							setReloadKey((key) => key + 1);
						},
						children: "重试"
					})
				]
			});
			const rows = [];
			const seenProviders = /* @__PURE__ */ new Set();
			for (const group of catalog?.groups ?? []) {
				rows.push({
					id: group.id,
					name: group.name,
					models: group.models
				});
				seenProviders.add(group.id);
			}
			for (const key of drafts?.keys() ?? []) {
				const { provider } = keyParts(key);
				if (seenProviders.has(provider)) continue;
				seenProviders.add(provider);
				const models = [];
				for (const other of drafts?.keys() ?? []) {
					const parts = keyParts(other);
					if (parts.provider === provider) models.push({
						id: parts.model,
						name: parts.model
					});
				}
				rows.push({
					id: provider,
					name: provider,
					models,
					orphan: true
				});
			}
			const modelEntry = (providerId, modelId) => {
				return drafts?.get(keyOf(providerId, modelId));
			};
			const editorBody = (providerId, model) => {
				const key = keyOf(providerId, model.id);
				const entry = modelEntry(providerId, model.id) ?? defaultEntry({
					provider: providerId,
					model: model.id
				});
				const textField = (field) => (event) => {
					patchDraft(key, field, event.target.value);
				};
				const priceField = (label, field) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(PriceField, {
					label,
					value: entry[field],
					onCommit: (value) => {
						patchDraft(key, field, value);
					}
				});
				return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: PricingSection_module_css_default.editorGrid,
						children: [
							priceField("输入（未命中）$/M", "inputMissPrice"),
							priceField("输入（缓存命中）$/M", "inputHitPrice"),
							priceField("输出 $/M", "outputPrice")
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
						className: PricingSection_module_css_default.check,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: entry.peakEnabled,
							onChange: (event) => {
								patchDraft(key, "peakEnabled", event.target.checked);
							}
						}), "启用高峰期定价（按当前时间选择高峰/非高峰价格）"]
					}),
					entry.peakEnabled && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: PricingSection_module_css_default.peakBlock,
						children: [
							entry.peakWindows.map((window, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: PricingSection_module_css_default.windowRow,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
										className: PricingSection_module_css_default.field,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "高峰开始（HH:MM）" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											type: "time",
											value: window.start,
											onChange: (event) => {
												updateWindows(key, (windows) => windows.map((item, at) => at === index ? {
													...item,
													start: event.target.value
												} : item));
											}
										})]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
										className: PricingSection_module_css_default.field,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "高峰结束（HH:MM）" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											type: "time",
											value: window.end,
											onChange: (event) => {
												updateWindows(key, (windows) => windows.map((item, at) => at === index ? {
													...item,
													end: event.target.value
												} : item));
											}
										})]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: PricingSection_module_css_default.dangerButton,
										disabled: entry.peakWindows.length <= 1,
										onClick: () => {
											updateWindows(key, (windows) => windows.filter((_, at) => at !== index));
										},
										children: "删除时段"
									})
								]
							}, index)),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: PricingSection_module_css_default.secondaryButton,
								onClick: () => {
									updateWindows(key, (windows) => [...windows, { ...DEFAULT_PEAK_WINDOW }]);
								},
								children: "添加高峰时段"
							}) }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: PricingSection_module_css_default.editorGrid,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
										className: PricingSection_module_css_default.field,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "时区" }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
											value: entry.peakTimeZone,
											onChange: textField("peakTimeZone"),
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
												value: "local",
												children: "本地时间"
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
												value: "utc",
												children: "UTC"
											})]
										})]
									}),
									priceField("高峰输入（未命中）$/M", "peakInputMissPrice"),
									priceField("高峰输入（命中）$/M", "peakInputHitPrice"),
									priceField("高峰输出 $/M", "peakOutputPrice")
								]
							})
						]
					}),
					modelEntry(providerId, model.id) !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: PricingSection_module_css_default.editorActions,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: PricingSection_module_css_default.dangerButton,
							onClick: () => {
								removeDraft(key);
							},
							children: "清除该模型的价格配置"
						})
					})
				] });
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: PricingSection_module_css_default.section,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
						className: PricingSection_module_css_default.title,
						children: "模型定价"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: PricingSection_module_css_default.intro,
						children: "为各提供方的各模型配置每百万 token 价格（美元）。输入价格分为缓存未命中与缓存命中；缓存写入按未命中价计费。 启用高峰定价后，可添加多个高峰时段（默认为一个），当前时间落入任一时段即按高峰价格计费；时段支持跨午夜（如 22:00–08:00）。 未配置价格的模型不显示费用。"
					}),
					status === "saved" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: PricingSection_module_css_default.saved,
						role: "status",
						children: "已保存"
					}),
					rows.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: PricingSection_module_css_default.empty,
						children: "当前没有可用的提供方或模型。"
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
						className: PricingSection_module_css_default.rows,
						children: rows.map((row) => {
							const models = [...row.models];
							const seenModels = new Set(models.map((model) => model.id));
							for (const key of drafts?.keys() ?? []) {
								const parts = keyParts(key);
								if (parts.provider === row.id && !seenModels.has(parts.model)) {
									models.push({
										id: parts.model,
										name: parts.model
									});
									seenModels.add(parts.model);
								}
							}
							const configured = models.filter((model) => modelEntry(row.id, model.id) !== void 0).length;
							return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
								className: PricingSection_module_css_default.rowCard,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: PricingSection_module_css_default.rowHead,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: PricingSection_module_css_default.rowIdentity,
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: PricingSection_module_css_default.rowName,
												children: row.name
											}),
											row.orphan === true && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: PricingSection_module_css_default.rowTag,
												children: "未发现于目录"
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												className: PricingSection_module_css_default.rowTag,
												children: row.id
											})
										]
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: PricingSection_module_css_default.rowCount,
										children: [
											configured,
											"/",
											models.length,
											" 已配置"
										]
									})]
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: PricingSection_module_css_default.modelList,
									children: models.map((model) => {
										const key = keyOf(row.id, model.id);
										const entry = modelEntry(row.id, model.id);
										const open = editing === key;
										return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: PricingSection_module_css_default.modelEntry,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												className: PricingSection_module_css_default.modelRow,
												children: [
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														className: PricingSection_module_css_default.modelId,
														children: model.id
													}),
													model.name !== model.id && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														className: PricingSection_module_css_default.modelName,
														children: model.name
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														className: entry === void 0 ? PricingSection_module_css_default.dot : `${PricingSection_module_css_default.dot} ${PricingSection_module_css_default.dotOn}`,
														title: entry === void 0 ? "未配置价格" : "已配置价格"
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
														type: "button",
														className: PricingSection_module_css_default.secondaryButton,
														onClick: () => {
															setEditing(open ? null : key);
														},
														children: entry === void 0 ? "配置" : "编辑"
													})
												]
											}), open && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
												className: PricingSection_module_css_default.editor,
												children: editorBody(row.id, model)
											})]
										}, model.id);
									})
								})]
							}, row.id);
						})
					}),
					(catalog?.failures.length ?? 0) > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
						className: PricingSection_module_css_default.empty,
						children: ["以下提供方的模型目录加载失败：", catalog?.failures.map((failure) => `${failure.name}（${failure.message}）`).join("；")]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: PricingSection_module_css_default.actions,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: PricingSection_module_css_default.primaryButton,
								onClick: () => {
									save();
								},
								disabled: status === "saving" || drafts === null,
								children: status === "saving" ? "保存中…" : "保存配置"
							}),
							status === "saving" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: PricingSection_module_css_default.status,
								children: "保存中…"
							}),
							status === "error" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: `${PricingSection_module_css_default.status} ${PricingSection_module_css_default.statusError}`,
								children: "保存失败，请重试"
							})
						]
					})
				]
			});
		}
		//#endregion
		//#region src/client/index.ts
		/** Required services: both seats, the settings transport, and the RPC face. */
		const inject = [
			"slots",
			"settingsScope",
			"connection",
			"remote"
		];
		/**
		* Mount the dock readout, the floating window, and the settings section.
		* @param ctx - client root context.
		*/
		function apply(ctx) {
			const pricingScope = ctx.settingsScope.bind({ namespace: TOKEN_PRICING_NAMESPACE });
			const api = ctx.get("connection").api;
			const saveEntries = async (entries) => {
				await pricingScope.set("entries", entries);
				return pricingScope.getSnapshot();
			};
			ctx.slots.inject("conversation.composer.dock", () => ctx.slots.register({
				name: "conversation.composer.dock",
				id: "model-pricing",
				order: 20,
				inject: () => ({ hooks: { pricing: pricingScope } })
			}, PricingDock));
			ctx.slots.inject("shell.overlay", () => ctx.slots.register({
				name: "shell.overlay",
				id: "pricing-float",
				inject: () => ({ hooks: { pricing: pricingScope } })
			}, PricingFloat));
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "model-pricing",
				order: 30,
				label: () => "模型定价",
				inject: () => ({
					hooks: { pricing: pricingScope },
					api,
					saveEntries
				})
			}, PricingSection));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map