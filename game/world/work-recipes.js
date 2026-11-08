// Fictional café recipes: game ingredients/prices, never food-safety training.
export const WORK_RECIPES = Object.freeze([
 {id:'flat-white',name:'Flat white',price:5,ingredients:{coffee:1,milk:1},kind:'coffee',steps:[['grind','Grind beans',.68],['tamp','Tamp evenly',.55],['extract','Extract espresso',.64],['steam','Texture milk',.72],['pour','Pour a rosetta',.52]]},
 {id:'espresso',name:'Espresso',price:4,ingredients:{coffee:1},kind:'coffee',steps:[['grind','Grind beans',.68],['tamp','Tamp evenly',.55],['extract','Extract espresso',.64]]},
 {id:'eggs-toast',name:'Eggs on toast',price:13,ingredients:{eggs:2,bread:1},kind:'food',steps:[['prep','Crack eggs and prepare toast',.5],['cook','Time the eggs',.67],['plate','Plate breakfast',.55]]},
 {id:'vegie-toastie',name:'Vegetable toastie',price:12,ingredients:{bread:2,veg:1},kind:'food',steps:[['prep','Assemble the toastie',.55],['cook','Toast until golden',.65],['plate','Slice and plate',.5]]},
 {id:'pie',name:'Meat pie',price:9,ingredients:{pie:1},kind:'oven',steps:[['tray','Load the oven tray',.5],['bake','Time the bake',.7],['plate','Plate the pie',.5]]},
 {id:'black-tea',name:'Pot of tea',price:4,ingredients:{tea:1},kind:'tea',steps:[['fill','Fill the teapot',.65],['steep','Time the steep',.6],['pour','Pour the tea',.55]]}
]);
export const recipeFor=id=>FULL_WORK_MENU.find(r=>r.id===id);
export const CAFE_TABLES=[[-4.2,2.8],[-1.6,2.8],[-4.2,-.8],[-1.6,-.8],[1.6,2.8],[4.2,2.8]];
export const STORE_GOODS={coffee:{name:'Coffee',zone:'dry',colour:0x9d6542},tea:{name:'Tea',zone:'dry',colour:0x639354},bread:{name:'Bread',zone:'bakery',colour:0xe4b76e},milk:{name:'Milk',zone:'chilled',colour:0xe7edf4},eggs:{name:'Eggs',zone:'chilled',colour:0xd1b892}};

// Recipes share the public café menu's prices and finite ingredients.
const coffee=[['grind','Grind beans',.68],['tamp','Tamp evenly',.55],['extract','Extract espresso',.64]];
const extras=[
 ['long-black','Long black',4,{coffee:1},'coffee',[...coffee,['fill','Top with hot water',.6]]],
 ['latte','Latte',5,{coffee:1,milk:1},'coffee',[...coffee,['steam','Texture milk',.72],['latte-art','Draw a latte-art heart',.55]]],
 ['cappuccino','Cappuccino',5,{coffee:1,milk:1},'coffee',[...coffee,['steam','Build microfoam',.75],['latte-art','Draw a foam heart',.55]]],
 ['iced-latte','Iced latte',6,{coffee:1,milk:1},'coffee',[...coffee,['fill','Layer cold milk and espresso',.65]]],
 ['milk-tea','Tea with milk',4,{tea:1,milk:1},'tea',[['fill','Fill teapot',.65],['steep','Time tea steeping',.6],['pour','Add requested milk',.55]]],
 ['soy-latte','Soy latte (contains SOY)',6,{coffee:1,soymilk:1},'coffee',[...coffee,['steam','Steam dedicated soy jug; prevent cross-contact',.75],['latte-art','Pour soy microfoam',.55]]],
 ['soy-flat-white','Soy flat white (contains SOY)',6,{coffee:1,soymilk:1},'coffee',[...coffee,['steam','Texture soy separately',.75],['pour','Pour the flat white',.55]]],
 ['soy-iced-latte','Iced soy latte (contains SOY)',7,{coffee:1,soymilk:1},'coffee',[...coffee,['fill','Use chilled labelled soy carton',.65]]],
 ['fruit-juice','Fresh fruit juice',6,{fruit:2},'food',[['prep','Wash and halve fruit',.5],['press','Press fresh juice',.65],['pour','Pour and garnish',.55]]],
 ['toast','Toast',5,{bread:1},'food',[['prep','Slice bread',.5],['cook','Toast evenly',.65],['plate','Plate toast',.55]]],
 ['big-brekkie','Big breakfast',19,{eggs:2,bread:1,veg:1},'food',[['prep','Prepare eggs, bread and vegetables',.5],['cook','Coordinate griddle cooking',.65],['plate','Plate all breakfast components',.55]]],
 ['soup','Vegetable soup with bread',13,{veg:2,bread:1},'food',[['prep','Chop vegetables',.5],['cook','Stir and simmer soup',.65],['plate','Serve soup and bread',.55]]],
 ['fruit-bowl','Fresh fruit bowl',9,{fruit:2},'food',[['prep','Wash and cut fruit',.5],['plate','Arrange fruit bowl',.55]]]
].map(([id,name,price,ingredients,kind,steps])=>({id,name,price,ingredients,kind,steps}));
export const FULL_WORK_MENU=Object.freeze([...WORK_RECIPES,...extras]);
export function orderRecipe(order){
 const ids=order.items?.length?order.items:[order.item],recipes=ids.map(id=>FULL_WORK_MENU.find(r=>r.id===id)).filter(Boolean);
 if(!recipes.length)return recipeFor(order.item);
 const ingredients={};for(const r of recipes)for(const[g,n]of Object.entries(r.ingredients))ingredients[g]=(ingredients[g]||0)+n;
 if(order.milk==='oat'&&ingredients.milk){ingredients.oatmilk=ingredients.milk;delete ingredients.milk;}
 if(order.milk==='soy'&&ingredients.milk){ingredients.soymilk=ingredients.milk;delete ingredients.milk;}
 if(ids.some(id=>id.startsWith('soy-'))&&ingredients.milk){ingredients.soymilk=(ingredients.soymilk||0)+ingredients.milk;delete ingredients.milk;}
 if(order.diet==='gluten-free')delete ingredients.bread;
 const multi=recipes.length>1;
 return {id:order.item,name:recipes.map(r=>r.name).join(' + ')+(order.milk==='oat'?' · oat milk':order.milk==='soy'?' · SOY allergen':order.milk==='skim'&&recipes.some(r=>r.ingredients.milk)?' · skim milk':'')+(order.diet&&order.diet!=='standard'?' · '+order.diet:''),price:recipes.reduce((n,r)=>n+r.price,0),ingredients,kind:recipes.some(r=>['food','oven'].includes(r.kind))?'food':recipes[0].kind,
 steps:recipes.flatMap((r,i)=>r.steps.map(([id,label,target])=>[multi?i+':'+id:id,(multi?r.name+' · ':'')+label,target,['food','oven'].includes(r.kind)?'kitchen':'barista'])),hasMilk:!!ingredients.milk||!!ingredients.oatmilk||!!ingredients.soymilk};
}
