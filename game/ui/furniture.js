// Context-aware, non-destructive interaction for passive furniture.
// Ordinary exhibits (with their authored actions) keep precedence.
const EXPLANATIONS = Object.freeze({
  bed:'A made-up bed for the people who live here. Guests can sleep in a booked room at the Railway Hotel.',
  bookshelf:'Browse the books and belongings on the shelves.',
  table:'A solid table used for meals, games and everyday work.',
  desk:'A work surface with room for books, correspondence and equipment.',
  wardrobe:'Storage for clothing and household belongings.',
  lamp:'A lamp for reading or lighting the room.',
  fridge:'Food is kept chilled here between meals.',
  pantry:'Dry goods and cooking supplies are stored here.',
  stove:'A cooking space where meals are prepared.',
  clock:'A working reminder of the passing hours in town.',
  rug:'A soft floor covering which makes the room more comfortable.',
  sofa:'A place to sit and relax.',
  chair:'A place to sit at a table or desk.',
  bench:'A shared seat for resting.',
  stool:'A small seat for the counter or workbench.',
  throne:'A ceremonial seat.',
  pews:'A wooden bench where people sit together.',
});
export function furniturePanel(item) {
  const name=String(item.label||item.type||'Furniture');
  const body=EXPLANATIONS[item.type] ||
    'A furnishing or useful object in this room. It has no special operating controls.';
  return {title:name,body:'<p>'+body+'</p>',actions:[]};
}
