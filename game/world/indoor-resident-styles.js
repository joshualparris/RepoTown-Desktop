// Apply the same chosen resident render style inside civic buildings as outdoors.
// Indoor staff and visitors are Walker/makeDistinctPerson objects, not TownLife people.
// Keep their original joints for collision/interaction and hide only the figure body.
export function createIndoorResidentStyles(models) {
  const adapters = new Map();
  function release(person) {
    const adapter = adapters.get(person);
    if (!adapter) return;
    models.hide(adapter);
    adapters.delete(person);
  }
  function sync(people, dt) {
    const present = new Set(people || []);
    for (const person of adapters.keys()) if (!present.has(person)) release(person);
    for (const person of present) {
      const group = person?.group;
      // Ordinary procedural-only actors cannot use the rigged identity pipeline.
      if (!group?.userData?.residentAppearance?.descriptor) continue;
      let adapter = adapters.get(person);
      if (!adapter) {
        // Names/prompts must stay visible when the old model is hidden.
        const body = group.children.filter(child =>
          child !== person.tag && !child.isSprite &&
          !child.userData?.labelKind && child.visible !== false);
        if (!body.length) continue;
        adapter = { fig: { group }, body, model: null };
        adapters.set(person, adapter);
      }
      if (group.visible === false) { models.hide(adapter); continue; }
      const moving = person.state === 'walking' ||
        (!!person.route?.length && person.state !== 'seated');
      models.update(adapter, {
        dt, dist: 0, moving, speed: person.speed || 1.1,
        talking: !!person.talking, seated: person.state === 'seated',
        riding: false, carrying: false,
      });
    }
  }
  function clear() { for (const person of [...adapters.keys()]) release(person); }
  function wearing() {
    let n = 0;
    for (const adapter of adapters.values()) if (adapter.model) n++;
    return n;
  }
  return { sync, clear, wearing };
}
