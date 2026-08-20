<template><math-field ref="field" class="math-expression" :aria-label="label"></math-field></template>
<script>
import {expressionToLatex,normalizeMathInput} from '../lib/math/mathInput.js';

export default {
  name:'MathExpressionInput',
  props:{modelValue:{type:String,default:''},label:{type:String,default:'Mathematical expression'}},
  emits:['update:modelValue','enter'],
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
  watch:{modelValue(value){const field=this.$refs.field;if(!field?.getValue||field===document.activeElement)return;const current=normalizeMathInput(field.getValue('ascii-math'));if(current!==value)field.setValue(expressionToLatex(value),{silenceNotifications:true});}}
}
</script>
<style scoped>
.math-expression{display:block;box-sizing:border-box;min-width:0;width:100%;padding:7px 9px;border:1px solid #2c4562;border-radius:3px;background:#061121;color:#dcecff;font-size:17px;--caret-color:#57c7ff;--selection-background-color:#174f75}
.math-expression:focus-within{border-color:#42aaf5;box-shadow:0 0 0 1px rgba(66,170,245,.2)}
</style>
