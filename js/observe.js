class Observe {
    constructor(data) {
        this.$data = data
        this.walk()
    }

    walk() {
        Object.keys(this.$data).forEach(key => {
            this.defineReactive(this.$data, key, this.$data[key])
        })
    }

    defineReactive(data, key, val) {
        let dep = new Dep()
        let childObj = observe(val)

        Object.defineProperty(data, key, {
            configurable: false,
            enumerable: true,
            get() {
                return val
            },
            set(newVal) {
                if (newVal === val) return
                val = newVal
                childObj = observe(newVal)
            }
        })
    }
}

function observe(data) {
    if (!data || typeof data !== 'object') return
    return new Observer(data)
}

let uid = 0

function Dep() {
    this.id = uid++
    this.subs = []
}

Dep.prototype = {
    addSub(sub) {
        this.subs.push(sub)
    },

    depend() {
        Dep.target.addDep(this)
    },

    removeSub(sub) {
        let index = this.subs.findIndex(sub)
        if (index !== -1) {
            this.subs.splice(index, 1)
        }
    },

    notify() {
        this.subs.forEach((sub) => {
            sub.update()
        })
    }
}