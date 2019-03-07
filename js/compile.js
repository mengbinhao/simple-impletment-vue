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
        let reg = /\{\{(.+)\}\}/g
        Array.from(childNodes).forEach(node => {
            if (this.isElement(node)) {
                //compile element
                this.compile(node)
            } else if (this.isTextNode(node) && reg.test(node.textContent)) {
                this.compileText(node, RegExp.$1.trim())
            }

            if (node.childNodes && node.childNodes.length) {
                this.compileElement(node)
            }
        })
    }

    compile() {

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
            val = val[k]
        })
        return val
    }
}

let updater = {
    textUpdater(node, value) {
        node.textContent = typeof value === 'undefined' ? '' : value
    }
}