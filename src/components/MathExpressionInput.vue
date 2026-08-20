<template><math-field ref="field" class="math-expression" :aria-label="label"></math-field></template>
<script>
import 'mathlive';

export default {
  name:'MathExpressionInput',
  props:{modelValue:{type:String,default:''},label:{type:String,default:'Mathematical expression'}},
  emits:['update:modelValue','enter'],
  mounted(){
    const field=this.$refs.field;
    field.mathVirtualKeyboardPolicy='auto';
    field.smartFence=true;
    field.setValue(toLatex(this.modelValue),{silenceNotifications:true});
    this.onInput=()=>this.$emit('update:modelValue',normalizeAscii(field.getValue('ascii-math')));
    this.onKey=e=>{if(e.key==='Enter'){e.preventDefault();this.$emit('enter');}};
    field.addEventListener('input',this.onInput);field.addEventListener('keydown',this.onKey);
  },
  beforeUnmount(){this.$refs.field?.removeEventListener('input',this.onInput);this.$refs.field?.removeEventListener('keydown',this.onKey);},
  watch:{modelValue(value){const field=this.$refs.field;if(!field||field===document.activeElement)return;const current=normalizeAscii(field.getValue('ascii-math'));if(current!==value)field.setValue(toLatex(value),{silenceNotifications:true});}}
}
function normalizeAscii(value){return String(value).replace(/\bpi\b/gi,'pi').replace(/\s+/g,'').replace(/\u2212/g,'-');}
function toLatex(value){return String(value).replace(/\b(sin|cos|tan|asin|acos|atan|sqrt|abs|exp|log|floor|ceil|min|max)\b/g,'\\$1').replace(/\*/g,'\\cdot ');}
</script>
<style scoped>
.math-expression{display:block;box-sizing:border-box;min-width:0;width:100%;padding:7px 9px;border:1px solid #2c4562;border-radius:3px;background:#061121;color:#dcecff;font-size:17px;--caret-color:#57c7ff;--selection-background-color:#174f75}
.math-expression:focus-within{border-color:#42aaf5;box-shadow:0 0 0 1px rgba(66,170,245,.2)}
</style>
