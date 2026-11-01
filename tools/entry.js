// Motor da geleia do app, empacotado para a landing: as notas da página usam o mesmo desenho (jelly.js) e as mesmas cores (flavors.js, geleia.json).
import { drawJelly, setRecipe, glowOf } from '../../app/renderer/jelly.js';
import flav from '../../app/src/flavors.js';
import recipe from '../../app/assets/geleia.json';
window.JELLY = { drawJelly, setRecipe, glowOf, FLAVORS: flav.FLAVORS, tokens: flav.tokens, recipe };
