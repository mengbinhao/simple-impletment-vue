class Compile {
    constructor(el, vm) {
        this.$vm = vm
        this.$el = this.isElement(el) ? el : document.querySelector(el)

        if (this.$el) {
            this.$fragment = this.node2Fragment(this.$el)
            this.compileElement(this.$fragment)
            this.$el.appendChild(this.$fragment)
        }
    }

    isElement(node) {
        return node.nodeType === 1
    }

    isTextNode(node) {
        return node.nodeType == 3;
    }

    isDirective(attr) {
        return attr.startsWith('v-')
    }

    isEventDirevtive(dir) {
        return dir.startsWith('on')
    }

    node2Fragment(el) {
        let fragment = document.createDocumentFragment()
        let child
        while (child = el.firstChild) {
            fragment.append(child)
        }
        return fragment
    }

    compileElement(el) {
        let childNodes = el.childNodes
        Array.from(childNodes).forEach(node => {
            let reg = /\{\{\s*(\S+)\s*\}\}/g
            if (this.isElement(node)) {
                //compile element
                this.compile(node)
            } else if (this.isTextNode(node) && reg.test(node.textContent)) {
                this.compileText(node, RegExp.$1)
            }

            if (node.childNodes && node.childNodes.length) {
                this.compileElement(node)
            }
        })
    }

    compile(node) {
        let nodeAttrs = node.attributes
        Array.from(nodeAttrs).forEach(arr => {
            let attrName = arr.name
            if (this.isDirective(attrName)) {
                let exp = arr.value
                let dir = attrName.substring(2)
                if (this.isEventDirevtive(dir)) {
                    compileUtils.eventHandler(node, this.$vm, exp, dir)
                } else {
                    compileUtils[dir] && compileUtils[dir](node, this.$vm, exp)
                }
            }
        })
    }

    compileText(node, expr) {
        compileUtils.text(node, this.$vm, expr)
    }
}


// 指令处理集合
let compileUtils = {
    text(node, vm, expr) {
        this.bind(node, vm, expr, 'text')
    },
    bind(node, vm, expr, dir) {
        let updateFn = updater[dir + 'Updater']
        updateFn && updateFn(node, this._getVMVal(vm, expr))
    },
    _getVMVal(vm, expr) {
        let val = vm
        let exprs = expr.split('.')
        exprs.forEach(k => {
            val = val[k.trim()]
        })
        return val
    },
    eventHandler(node, vm, exp, dir) {
        let eventType = dir.split(':')[1]
            fn = vm.$options.methods && vm.$options.methods[exp]
        if (eventType && fn) {
            node.addEventListener(eventType, fn.bind(vm), false)
        }
    }
}

let updater = {
    textUpdater(node, value) {
        node.textContent = typeof value === 'undefined' ? '' : value
    }
}