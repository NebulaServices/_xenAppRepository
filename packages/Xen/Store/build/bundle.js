
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function destroy_block(block, lookup) {
        block.d(1);
        lookup.delete(block.key);
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.55.1' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    var applist = [
    	{
    		name: "test popular",
    		type: "testing",
    		icon: "https://static.vecteezy.com/system/resources/previews/009/469/630/large_2x/google-logo-isolated-editorial-icon-free-vector.jpg",
    		screenshots: [
    			"https://i.pcmag.com/imagery/articles/03b1TTrW7CGBYvLSqjsBJeW-1.fit_lim.v1672831841.jpg",
    			"https://cdn.vox-cdn.com/thumbor/gRLz5BTyQUUdozuDkbGbEt_Tv0Q=/0x0:2490x1170/2000x1333/filters:focal(1245x585:1246x586)/cdn.vox-cdn.com/uploads/chorus_asset/file/24407544/Screenshot_2023_02_03_at_17.26.40.png"
    		],
    		description: "this is a kool apppppp",
    		popular: true,
    		downloaded: false
    	}
    ];

    var appjson = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': applist
    });

    /* src/App.svelte generated by Svelte v3.55.1 */

    const { console: console_1 } = globals;
    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i].name;
    	child_ctx[8] = list[i].type;
    	child_ctx[9] = list[i].icon;
    	child_ctx[10] = list[i].downloaded;
    	child_ctx[11] = list[i].screenshots;
    	child_ctx[12] = list[i].description;
    	child_ctx[14] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i].name;
    	child_ctx[8] = list[i].type;
    	child_ctx[9] = list[i].icon;
    	child_ctx[10] = list[i].downloaded;
    	child_ctx[14] = i;
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i].name;
    	child_ctx[8] = list[i].type;
    	child_ctx[9] = list[i].icon;
    	child_ctx[14] = i;
    	return child_ctx;
    }

    function get_each_context_4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i].name;
    	child_ctx[8] = list[i].type;
    	child_ctx[9] = list[i].icon;
    	child_ctx[20] = list[i].popular;
    	child_ctx[14] = i;
    	return child_ctx;
    }

    // (102:6) {#if popular == true}
    function create_if_block_2(ctx) {
    	let button;
    	let img;
    	let img_src_value;
    	let t0;
    	let div;
    	let p0;
    	let t1_value = /*name*/ ctx[7] + "";
    	let t1;
    	let t2;
    	let p1;
    	let t3_value = /*type*/ ctx[8] + "";
    	let t3;
    	let t4;
    	let mounted;
    	let dispose;

    	function click_handler_3() {
    		return /*click_handler_3*/ ctx[4](/*name*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			img = element("img");
    			t0 = space();
    			div = element("div");
    			p0 = element("p");
    			t1 = text(t1_value);
    			t2 = space();
    			p1 = element("p");
    			t3 = text(t3_value);
    			t4 = space();
    			if (!src_url_equal(img.src, img_src_value = /*icon*/ ctx[9])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			add_location(img, file, 106, 10, 4500);
    			attr_dev(p0, "class", "appname");
    			add_location(p0, file, 108, 12, 4571);
    			attr_dev(p1, "class", "apptype");
    			add_location(p1, file, 109, 12, 4613);
    			attr_dev(div, "class", "textinfo");
    			add_location(div, file, 107, 10, 4536);
    			attr_dev(button, "class", "appentry " + /*name*/ ctx[7].replace(/\s/g, "") + "button");
    			add_location(button, file, 102, 8, 4343);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, img);
    			append_dev(button, t0);
    			append_dev(button, div);
    			append_dev(div, p0);
    			append_dev(p0, t1);
    			append_dev(div, t2);
    			append_dev(div, p1);
    			append_dev(p1, t3);
    			append_dev(button, t4);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_3, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(102:6) {#if popular == true}",
    		ctx
    	});

    	return block;
    }

    // (101:4) {#each apps as { name, type, icon, popular }
    function create_each_block_4(key_1, ctx) {
    	let first;
    	let if_block_anchor;
    	let if_block = /*popular*/ ctx[20] == true && create_if_block_2(ctx);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (/*popular*/ ctx[20] == true) if_block.p(ctx, dirty);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_4.name,
    		type: "each",
    		source: "(101:4) {#each apps as { name, type, icon, popular }",
    		ctx
    	});

    	return block;
    }

    // (120:4) {#each apps as { name, type, icon }
    function create_each_block_3(key_1, ctx) {
    	let button;
    	let img;
    	let img_src_value;
    	let t0;
    	let div;
    	let p0;
    	let t1_value = /*name*/ ctx[7] + "";
    	let t1;
    	let t2;
    	let p1;
    	let t3_value = /*type*/ ctx[8] + "";
    	let t3;
    	let t4;
    	let mounted;
    	let dispose;

    	function click_handler_4() {
    		return /*click_handler_4*/ ctx[5](/*name*/ ctx[7]);
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			button = element("button");
    			img = element("img");
    			t0 = space();
    			div = element("div");
    			p0 = element("p");
    			t1 = text(t1_value);
    			t2 = space();
    			p1 = element("p");
    			t3 = text(t3_value);
    			t4 = space();
    			if (!src_url_equal(img.src, img_src_value = /*icon*/ ctx[9])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			add_location(img, file, 124, 8, 5043);
    			attr_dev(p0, "class", "appname");
    			add_location(p0, file, 126, 10, 5110);
    			attr_dev(p1, "class", "apptype");
    			add_location(p1, file, 127, 10, 5150);
    			attr_dev(div, "class", "textinfo");
    			add_location(div, file, 125, 8, 5077);
    			attr_dev(button, "class", "appentry " + /*name*/ ctx[7].replace(/\s/g, "") + "button");
    			add_location(button, file, 120, 6, 4894);
    			this.first = button;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, img);
    			append_dev(button, t0);
    			append_dev(button, div);
    			append_dev(div, p0);
    			append_dev(p0, t1);
    			append_dev(div, t2);
    			append_dev(div, p1);
    			append_dev(p1, t3);
    			append_dev(button, t4);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_4, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(120:4) {#each apps as { name, type, icon }",
    		ctx
    	});

    	return block;
    }

    // (138:6) {#if downloaded == true}
    function create_if_block_1(ctx) {
    	let button1;
    	let img;
    	let img_src_value;
    	let t0;
    	let div;
    	let p0;
    	let t1_value = /*name*/ ctx[7] + "";
    	let t1;
    	let t2;
    	let p1;
    	let t3_value = /*type*/ ctx[8] + "";
    	let t3;
    	let t4;
    	let button0;
    	let t6;
    	let mounted;
    	let dispose;

    	function click_handler_5() {
    		return /*click_handler_5*/ ctx[6](/*name*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			button1 = element("button");
    			img = element("img");
    			t0 = space();
    			div = element("div");
    			p0 = element("p");
    			t1 = text(t1_value);
    			t2 = space();
    			p1 = element("p");
    			t3 = text(t3_value);
    			t4 = space();
    			button0 = element("button");
    			button0.textContent = "Open";
    			t6 = space();
    			if (!src_url_equal(img.src, img_src_value = /*icon*/ ctx[9])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			add_location(img, file, 142, 10, 5591);
    			attr_dev(p0, "class", "appname");
    			add_location(p0, file, 144, 12, 5662);
    			attr_dev(p1, "class", "apptype");
    			add_location(p1, file, 145, 12, 5704);
    			attr_dev(div, "class", "textinfo");
    			add_location(div, file, 143, 10, 5627);
    			add_location(button0, file, 147, 10, 5761);
    			attr_dev(button1, "class", "appentry " + /*name*/ ctx[7].replace(/\s/g, "") + "button");
    			add_location(button1, file, 138, 8, 5434);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button1, anchor);
    			append_dev(button1, img);
    			append_dev(button1, t0);
    			append_dev(button1, div);
    			append_dev(div, p0);
    			append_dev(p0, t1);
    			append_dev(div, t2);
    			append_dev(div, p1);
    			append_dev(p1, t3);
    			append_dev(button1, t4);
    			append_dev(button1, button0);
    			append_dev(button1, t6);

    			if (!mounted) {
    				dispose = listen_dev(button1, "click", click_handler_5, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(138:6) {#if downloaded == true}",
    		ctx
    	});

    	return block;
    }

    // (137:4) {#each apps as { name, type, icon, downloaded }
    function create_each_block_2(key_1, ctx) {
    	let first;
    	let if_block_anchor;
    	let if_block = /*downloaded*/ ctx[10] == true && create_if_block_1(ctx);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (/*downloaded*/ ctx[10] == true) if_block.p(ctx, dirty);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(137:4) {#each apps as { name, type, icon, downloaded }",
    		ctx
    	});

    	return block;
    }

    // (162:8) {:else}
    function create_else_block(ctx) {
    	let button;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Get";
    			add_location(button, file, 162, 10, 6199);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(162:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (160:8) {#if downloaded == true}
    function create_if_block(ctx) {
    	let button;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Open";
    			add_location(button, file, 160, 10, 6151);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(160:8) {#if downloaded == true}",
    		ctx
    	});

    	return block;
    }

    // (171:12) {#each screenshots as screenshot}
    function create_each_block_1(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			attr_dev(img, "alt", "screenshot");
    			if (!src_url_equal(img.src, img_src_value = /*screenshot*/ ctx[15])) attr_dev(img, "src", img_src_value);
    			add_location(img, file, 171, 14, 6455);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(171:12) {#each screenshots as screenshot}",
    		ctx
    	});

    	return block;
    }

    // (154:0) {#each apps as { name, type, icon, downloaded, screenshots, description }
    function create_each_block(key_1, ctx) {
    	let div6;
    	let div5;
    	let div0;
    	let h1;
    	let t0_value = /*name*/ ctx[7] + "";
    	let t0;
    	let t1;
    	let img;
    	let img_src_value;
    	let t2;
    	let t3;
    	let p0;
    	let t4_value = /*type*/ ctx[8] + "";
    	let t4;
    	let t5;
    	let div4;
    	let div2;
    	let h40;
    	let t7;
    	let div1;
    	let t8;
    	let div3;
    	let h41;
    	let t10;
    	let p1;
    	let t11_value = /*description*/ ctx[12] + "";
    	let t11;
    	let t12;

    	function select_block_type(ctx, dirty) {
    		if (/*downloaded*/ ctx[10] == true) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);
    	let each_value_1 = /*screenshots*/ ctx[11];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div6 = element("div");
    			div5 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			t0 = text(t0_value);
    			t1 = space();
    			img = element("img");
    			t2 = space();
    			if_block.c();
    			t3 = space();
    			p0 = element("p");
    			t4 = text(t4_value);
    			t5 = space();
    			div4 = element("div");
    			div2 = element("div");
    			h40 = element("h4");
    			h40.textContent = "Screenshots";
    			t7 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t8 = space();
    			div3 = element("div");
    			h41 = element("h4");
    			h41.textContent = "Description";
    			t10 = space();
    			p1 = element("p");
    			t11 = text(t11_value);
    			t12 = space();
    			add_location(h1, file, 157, 8, 6050);
    			if (!src_url_equal(img.src, img_src_value = /*icon*/ ctx[9])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "app icon");
    			add_location(img, file, 158, 8, 6074);
    			add_location(p0, file, 164, 8, 6242);
    			attr_dev(div0, "class", "leftside");
    			add_location(div0, file, 156, 6, 6019);
    			add_location(h40, file, 168, 10, 6343);
    			attr_dev(div1, "class", "images");
    			add_location(div1, file, 169, 10, 6374);
    			attr_dev(div2, "class", "screenshots");
    			add_location(div2, file, 167, 8, 6307);
    			add_location(h41, file, 176, 10, 6593);
    			add_location(p1, file, 177, 10, 6624);
    			attr_dev(div3, "class", "description");
    			add_location(div3, file, 175, 8, 6557);
    			attr_dev(div4, "class", "rightside");
    			add_location(div4, file, 166, 6, 6275);
    			attr_dev(div5, "class", "productpage");
    			add_location(div5, file, 155, 4, 5987);
    			attr_dev(div6, "id", /*name*/ ctx[7].replace(/\s/g, ""));
    			attr_dev(div6, "class", "storepage");
    			add_location(div6, file, 154, 2, 5930);
    			this.first = div6;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div6, anchor);
    			append_dev(div6, div5);
    			append_dev(div5, div0);
    			append_dev(div0, h1);
    			append_dev(h1, t0);
    			append_dev(div0, t1);
    			append_dev(div0, img);
    			append_dev(div0, t2);
    			if_block.m(div0, null);
    			append_dev(div0, t3);
    			append_dev(div0, p0);
    			append_dev(p0, t4);
    			append_dev(div5, t5);
    			append_dev(div5, div4);
    			append_dev(div4, div2);
    			append_dev(div2, h40);
    			append_dev(div2, t7);
    			append_dev(div2, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			append_dev(div4, t8);
    			append_dev(div4, div3);
    			append_dev(div3, h41);
    			append_dev(div3, t10);
    			append_dev(div3, p1);
    			append_dev(p1, t11);
    			append_dev(div6, t12);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*apps*/ 1) {
    				each_value_1 = /*screenshots*/ ctx[11];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div6);
    			if_block.d();
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(154:0) {#each apps as { name, type, icon, downloaded, screenshots, description }",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div0;
    	let button0;
    	let svg0;
    	let path0;
    	let t0;
    	let button1;
    	let svg1;
    	let path1;
    	let t1;
    	let button2;
    	let svg2;
    	let path2;
    	let t2;
    	let div2;
    	let img0;
    	let img0_src_value;
    	let t3;
    	let div1;
    	let each_blocks_3 = [];
    	let each0_lookup = new Map();
    	let t4;
    	let div4;
    	let img1;
    	let img1_src_value;
    	let t5;
    	let div3;
    	let each_blocks_2 = [];
    	let each1_lookup = new Map();
    	let t6;
    	let div6;
    	let h2;
    	let t8;
    	let div5;
    	let each_blocks_1 = [];
    	let each2_lookup = new Map();
    	let t9;
    	let each_blocks = [];
    	let each3_lookup = new Map();
    	let each3_anchor;
    	let mounted;
    	let dispose;
    	let each_value_4 = /*apps*/ ctx[0];
    	validate_each_argument(each_value_4);
    	const get_key = ctx => /*name*/ ctx[7];
    	validate_each_keys(ctx, each_value_4, get_each_context_4, get_key);

    	for (let i = 0; i < each_value_4.length; i += 1) {
    		let child_ctx = get_each_context_4(ctx, each_value_4, i);
    		let key = get_key(child_ctx);
    		each0_lookup.set(key, each_blocks_3[i] = create_each_block_4(key, child_ctx));
    	}

    	let each_value_3 = /*apps*/ ctx[0];
    	validate_each_argument(each_value_3);
    	const get_key_1 = ctx => /*name*/ ctx[7];
    	validate_each_keys(ctx, each_value_3, get_each_context_3, get_key_1);

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		let child_ctx = get_each_context_3(ctx, each_value_3, i);
    		let key = get_key_1(child_ctx);
    		each1_lookup.set(key, each_blocks_2[i] = create_each_block_3(key, child_ctx));
    	}

    	let each_value_2 = /*apps*/ ctx[0];
    	validate_each_argument(each_value_2);
    	const get_key_2 = ctx => /*name*/ ctx[7];
    	validate_each_keys(ctx, each_value_2, get_each_context_2, get_key_2);

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		let child_ctx = get_each_context_2(ctx, each_value_2, i);
    		let key = get_key_2(child_ctx);
    		each2_lookup.set(key, each_blocks_1[i] = create_each_block_2(key, child_ctx));
    	}

    	let each_value = /*apps*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key_3 = ctx => /*name*/ ctx[7];
    	validate_each_keys(ctx, each_value, get_each_context, get_key_3);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key_3(child_ctx);
    		each3_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			button0 = element("button");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			t0 = space();
    			button1 = element("button");
    			svg1 = svg_element("svg");
    			path1 = svg_element("path");
    			t1 = space();
    			button2 = element("button");
    			svg2 = svg_element("svg");
    			path2 = svg_element("path");
    			t2 = space();
    			div2 = element("div");
    			img0 = element("img");
    			t3 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				each_blocks_3[i].c();
    			}

    			t4 = space();
    			div4 = element("div");
    			img1 = element("img");
    			t5 = space();
    			div3 = element("div");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t6 = space();
    			div6 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Downloaded Apps";
    			t8 = space();
    			div5 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t9 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each3_anchor = empty();
    			attr_dev(path0, "stroke-linecap", "round");
    			attr_dev(path0, "stroke-linejoin", "round");
    			attr_dev(path0, "d", "M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25");
    			add_location(path0, file, 50, 6, 1648);
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "fill", "none");
    			attr_dev(svg0, "viewBox", "0 0 24 24");
    			attr_dev(svg0, "stroke-width", "1.5");
    			attr_dev(svg0, "stroke", "currentColor");
    			attr_dev(svg0, "class", "w-6 h-6");
    			add_location(svg0, file, 42, 4, 1471);
    			attr_dev(button0, "class", "sidebarbutton homepagebutton");
    			add_location(button0, file, 38, 2, 1371);
    			attr_dev(path1, "stroke-linecap", "round");
    			attr_dev(path1, "stroke-linejoin", "round");
    			attr_dev(path1, "d", "M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 1.5v-1.5m0 0c0-.621.504-1.125 1.125-1.125m0 0h7.5");
    			add_location(path1, file, 69, 6, 2273);
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "fill", "none");
    			attr_dev(svg1, "viewBox", "0 0 24 24");
    			attr_dev(svg1, "stroke-width", "1.5");
    			attr_dev(svg1, "stroke", "currentColor");
    			attr_dev(svg1, "class", "w-6 h-6");
    			add_location(svg1, file, 61, 4, 2096);
    			attr_dev(button1, "class", "sidebarbutton allappsbutton");
    			add_location(button1, file, 57, 2, 1998);
    			attr_dev(path2, "stroke-linecap", "round");
    			attr_dev(path2, "stroke-linejoin", "round");
    			attr_dev(path2, "d", "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3");
    			add_location(path2, file, 88, 6, 3901);
    			attr_dev(svg2, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg2, "fill", "none");
    			attr_dev(svg2, "viewBox", "0 0 24 24");
    			attr_dev(svg2, "stroke-width", "1.5");
    			attr_dev(svg2, "stroke", "currentColor");
    			attr_dev(svg2, "class", "w-6 h-6");
    			add_location(svg2, file, 80, 4, 3724);
    			attr_dev(button2, "class", "sidebarbutton downloadsbutton");
    			add_location(button2, file, 76, 2, 3622);
    			attr_dev(div0, "id", "sidebar");
    			add_location(div0, file, 37, 0, 1350);
    			attr_dev(img0, "alt", "banner");
    			attr_dev(img0, "class", "banner");
    			if (!src_url_equal(img0.src, img0_src_value = "banner.png")) attr_dev(img0, "src", img0_src_value);
    			add_location(img0, file, 98, 2, 4167);
    			attr_dev(div1, "class", "appentries");
    			add_location(div1, file, 99, 2, 4222);
    			attr_dev(div2, "id", "homepage");
    			attr_dev(div2, "class", "storepage");
    			add_location(div2, file, 97, 0, 4127);
    			attr_dev(img1, "alt", "banner");
    			attr_dev(img1, "class", "banner");
    			if (!src_url_equal(img1.src, img1_src_value = "banner.png")) attr_dev(img1, "src", img1_src_value);
    			add_location(img1, file, 117, 2, 4757);
    			attr_dev(div3, "class", "appentries");
    			add_location(div3, file, 118, 2, 4812);
    			attr_dev(div4, "id", "allapps");
    			attr_dev(div4, "class", "storepage");
    			add_location(div4, file, 116, 0, 4718);
    			add_location(h2, file, 134, 2, 5280);
    			attr_dev(div5, "class", "appentries");
    			add_location(div5, file, 135, 2, 5307);
    			attr_dev(div6, "id", "downloads");
    			attr_dev(div6, "class", "storepage");
    			add_location(div6, file, 133, 0, 5239);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, button0);
    			append_dev(button0, svg0);
    			append_dev(svg0, path0);
    			append_dev(div0, t0);
    			append_dev(div0, button1);
    			append_dev(button1, svg1);
    			append_dev(svg1, path1);
    			append_dev(div0, t1);
    			append_dev(div0, button2);
    			append_dev(button2, svg2);
    			append_dev(svg2, path2);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, img0);
    			append_dev(div2, t3);
    			append_dev(div2, div1);

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				each_blocks_3[i].m(div1, null);
    			}

    			insert_dev(target, t4, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, img1);
    			append_dev(div4, t5);
    			append_dev(div4, div3);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(div3, null);
    			}

    			insert_dev(target, t6, anchor);
    			insert_dev(target, div6, anchor);
    			append_dev(div6, h2);
    			append_dev(div6, t8);
    			append_dev(div6, div5);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div5, null);
    			}

    			insert_dev(target, t9, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each3_anchor, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[1], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[2], false, false, false),
    					listen_dev(button2, "click", /*click_handler_2*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*apps, selectTab*/ 1) {
    				each_value_4 = /*apps*/ ctx[0];
    				validate_each_argument(each_value_4);
    				validate_each_keys(ctx, each_value_4, get_each_context_4, get_key);
    				each_blocks_3 = update_keyed_each(each_blocks_3, dirty, get_key, 1, ctx, each_value_4, each0_lookup, div1, destroy_block, create_each_block_4, null, get_each_context_4);
    			}

    			if (dirty & /*apps, selectTab*/ 1) {
    				each_value_3 = /*apps*/ ctx[0];
    				validate_each_argument(each_value_3);
    				validate_each_keys(ctx, each_value_3, get_each_context_3, get_key_1);
    				each_blocks_2 = update_keyed_each(each_blocks_2, dirty, get_key_1, 1, ctx, each_value_3, each1_lookup, div3, destroy_block, create_each_block_3, null, get_each_context_3);
    			}

    			if (dirty & /*apps, selectTab*/ 1) {
    				each_value_2 = /*apps*/ ctx[0];
    				validate_each_argument(each_value_2);
    				validate_each_keys(ctx, each_value_2, get_each_context_2, get_key_2);
    				each_blocks_1 = update_keyed_each(each_blocks_1, dirty, get_key_2, 1, ctx, each_value_2, each2_lookup, div5, destroy_block, create_each_block_2, null, get_each_context_2);
    			}

    			if (dirty & /*apps*/ 1) {
    				each_value = /*apps*/ ctx[0];
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context, get_key_3);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key_3, 1, ctx, each_value, each3_lookup, each3_anchor.parentNode, destroy_block, create_each_block, each3_anchor, get_each_context);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div2);

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				each_blocks_3[i].d();
    			}

    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div4);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].d();
    			}

    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(div6);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].d();
    			}

    			if (detaching) detach_dev(t9);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each3_anchor);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function selectTab(pagename) {
    	let page = document.querySelector("#" + pagename);
    	let button = document.querySelector("." + pagename + "button");
    	let sidebarbuttons = document.querySelectorAll(".sidebarbutton");
    	let pages = document.querySelectorAll(".storepage");

    	sidebarbuttons.forEach(elmnt => {
    		elmnt.classList.remove("active");
    	});

    	pages.forEach(elmnt => {
    		elmnt.classList = "storepage";
    		elmnt.style.display = "none";
    	});

    	button.classList.add("active");
    	page.classList.add("active");
    	page.style.display = "block";
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);

    	var apps = [
    		{
    			name: "test popular",
    			type: "testing",
    			icon: "icon.png",
    			screenshots: [
    				"banner.png"
    			],
    			description: "this is a kool apppppp",
    			popular: true,
    			downloaded: false
    		}
    	];

    	console.log(apps);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => selectTab("homepage");
    	const click_handler_1 = () => selectTab("allapps");
    	const click_handler_2 = () => selectTab("downloads");
    	const click_handler_3 = name => selectTab(name.replace(/\s/g, ""));
    	const click_handler_4 = name => selectTab(name.replace(/\s/g, ""));
    	const click_handler_5 = name => selectTab(name.replace(/\s/g, ""));
    	$$self.$capture_state = () => ({ appjson, apps, selectTab });

    	$$self.$inject_state = $$props => {
    		if ('apps' in $$props) $$invalidate(0, apps = $$props.apps);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		apps,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

})();
