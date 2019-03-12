class Compile {
    constructor(el, vm) {
        this.$vm = vm
        this.$el = this.isElement(el) ? el : document.querySelector(el)

        if (this.$el) {
            this.$fragment = this.node2Fragment(this.$el)
            this.init(this.$fragment)
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

    init(el) {
        this.compileElement(el)
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
            //recusion
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
    bind(node, vm, expr, dir) {
        let updateFn = updater[dir + 'Updater']
        updateFn && updateFn(node, this._getVMVal(vm, expr))
    },

    eventHandler(node, vm, exp, dir) {
        let eventType = dir.split(':')[1]
        fn = vm.$options.methods && vm.$options.methods[exp]
        if (eventType && fn) {
            node.addEventListener(eventType, fn.bind(vm), false)
        }
    },

    _getVMVal(vm, expr) {
        let val = vm
        let exprs = expr.split('.')
        exprs.forEach(k => {
            val = val[k.trim()]
        })
        return val
    },
    _setVMVal(vm, exp, value) {
        let val = vm
            exps = exp.split('.')
        exps.forEach((k, i) => {
            //非最后一个key,更新val值
            if (i < exps.length - 1) {
                val = val[k]
            } else {
                val[k] = value
            }
        })
    },

    model(node, vm, exp) {
        this.bind(node, vm, exp, 'model')

        let val = this._getVMVal(vm, exp)

        node.addEventListener('input', (e) => {
            let newVal = e.target.value
            if (val === newVal) return
            this._setVMVal(vm, exp, newVal)
            val = newVal
        })
    },

    text(node, vm, expr) {
        this.bind(node, vm, expr, 'text')
    }
}

let updater = {
    textUpdater(node, value) {
        node.textContent = typeof value === 'undefined' ? '' : value
    },

    modelUpdater(node, value) {
        node.value = typeof value === 'undefined' ? '' : value
    }
}