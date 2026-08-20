<template><div class='math-input-wrap'><math-field ref="field" class="math-expression" :aria-label="label"></math-field><button class='function-button' type='button' title='Insert a function' @click='picker=!picker'>ƒ</button><div v-if='picker' class='function-picker'><input v-model='search' placeholder='Search functions'><button v-for='fn in filtered' :key='fn' type='button' @click='insert(fn)'>{{fn}}( )</button></div></div></template>
<script>
import {expressionToLatex,normalizeMathInput} from '../lib/math/mathInput.js';

export default {
  name:'MathExpressionInput',
  props:{modelValue:{type:String,default:''},label:{type:String,default:'Mathematical expression'}},
  emits:['update:modelValue','enter'],
  data:()=>({picker:false,search:'',functions:['sin','cos','tan','arcsin','arccos','arctan','atan2','sinh','cosh','tanh','sqrt','cbrt','abs','exp','ln','log10','min','max','hypot','clamp','smoothstep','piecewise','between','root']}),
  computed:{filtered(){const q=this.search.toLowerCase();return this.functions.filter(x=>x.includes(q));}},
  async mounted(){
    await import('mathlive');
    const field=this.$refs.field;
    if(!field)return;
    field.mathVirtualKeyboardPolicy='auto';
    field.smartFence=true;
    field.setValue(expressionToLatex(this.modelValue),{silenceNotifications:true});
    this.onInput=()=>this.$emit('update:modelValue',normalizeMathInput(field.getValue('ascii-math')));
    this.onKey=e=>{if(e.key==='Enter'){e.preventDefault();this.$emit('enter');}};
    field.addEventListener('input',this.onInput);field.addEventListener('keydown',this.onKey);
  },
  beforeUnmount(){this.$refs.field?.removeEventListener('input',this.onInput);this.$refs.field?.removeEventListener('keydown',this.onKey);},
  methods:{insert(name){const field=this.$refs.field;field?.executeCommand?.(['insert',`\\${name}(#0)`]);field?.focus();this.picker=false;}},
  watch:{modelValue(value){const field=this.$refs.field;if(!field?.getValue||field===document.activeElement)return;const current=normalizeMathInput(field.getValue('ascii-math'));if(current!==value)field.setValue(expressionToLatex(value),{silenceNotifications:true});}}
}
</script>
<style scoped>
.math-input-wrap{position:relative;display:grid;grid-template-columns:1fr 30px;min-width:0}.math-expression{display:block;box-sizing:border-box;min-width:0;width:100%;padding:7px 9px;border:1px solid #2c4562;border-radius:3px 0 0 3px;background:#061121;color:#dcecff;font-size:17px;--caret-color:#57c7ff;--selection-background-color:#174f75}
.function-button{border:1px solid #2c4562;border-left:0;background:#0c2036;color:#74cfff;font:italic 17px serif;cursor:pointer}.function-picker{position:absolute;right:0;top:100%;z-index:20;width:260px;max-height:220px;overflow:auto;display:grid;grid-template-columns:repeat(2,1fr);gap:4px;padding:7px;background:#061121;border:1px solid #365875;box-shadow:0 10px 30px #000}.function-picker input{grid-column:1/-1;margin:0!important;padding:7px!important}.function-picker button{padding:6px;border:1px solid #294563;background:#0a1a2d;color:#b9dafa;text-align:left;cursor:pointer}
.math-expression:focus-within{border-color:#42aaf5;box-shadow:0 0 0 1px rgba(66,170,245,.2)}
</style>
