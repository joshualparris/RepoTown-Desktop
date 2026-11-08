// Workplace interiors built from evidence about the real business, one at a time
// (docs/NARROMINE_INTERIOR_EVIDENCE.md is the checklist). Each entry lists its sources and the rooms the
// evidence supports; anything without evidence stays the generic fit-out for its kind.
// Google Maps/Street View imagery is not used (its terms forbid storing or analysing it).
const S = (t, l, text) => [t, l, { do: 'info', title: l, text: text || 'Workstation.', station: true }];
const I = (t, l, text) => [t, l, { do: 'info', title: l, text }];

export const INTERIOR_EVIDENCE = Object.freeze({
  'Narromine Hotel': {
    checked: '2026-11-06',
    sources: [
      'JLL Hotels & Hospitality sale listing, Oct 2022, via thehotelconversation.com.au (public bar, beer garden, 20 pub-style rooms, 10 ensuite motel rooms, 3 gaming machine entitlements, 2,074 m² corner site at Dandaloo Street and Derribong Avenue)',
      'Gday Pubs directory entry, Narromine Hotel Motel (bistro, open fireplace, pool room, upstairs function room with balcony, drive-through bottle shop)',
      'Bottlemart Express directory listings at [address redacted] (drive-through bottle shop brand)',
      'Sale photographs published with the JLL listing on thehotelconversation.com.au (12 Oct 2022): public bar interior (public_bar_2.jpg) and exterior (narromine_hero_shot). Viewed for reference only; not copied into the game.',
    ],
    unknown: 'Only the public bar is photographed; the bistro, gaming room, pool room, bottle shop, function room and rooms upstairs are built from descriptions, so their layout and finishes are not evidenced. Room sizes are not published. In the public bar the barrel tables stand against the walls rather than out in the room as in the photo (a limit of the room builder).',
    rooms: [
      // Public bar as photographed for the 2022 sale (public_bar_2.jpg): dark patterned carpet, cream walls, a low
      // ceiling with fluorescent battens and two split-system air conditioners; a timber bar with a red top and a
      // central row of beer taps, spirit shelves and a mirror behind, two TVs and a memorabilia shelf of footy
      // helmets, trophies and pennants above; wine-barrel tables with tall stools and padded maroon swivel chairs;
      // a TAB terminal, a happy-hour chalkboard, a wall clock and a notice board.
      { name: 'Public bar', w: 12, d: 10, walls: 0xece6d6, floor: 0x3b3530, props: [
        S('counter', 'Public bar', 'Timber bar with a red top and a central row of beer taps (sale photo, 2022).'), I('shelf', 'Back bar', 'Spirit shelves and a mirror behind the bar.'), 'mirror',
        I('trophyCase', 'Memorabilia shelf', 'A shelf above the bar of footy helmets, trophies and team pennants (sale photo, 2022).'), I('tv', 'Bar TV', 'Two TVs above the bar, one showing racing.'), 'tv',
        I('barrel', 'Barrel table', 'Wine-barrel tables with timber tops (sale photo, 2022).'), 'barrel', 'barrel', 'stool', 'stool', 'stool', 'stool', I('chair', 'Swivel bar chair', 'Padded maroon swivel bar chairs.'), 'chair',
        I('terminal', 'TAB terminal', 'A TAB betting terminal by the wall (sale photo, 2022).'), I('chalkboard', 'Happy hour board', 'Chalkboard: happy hour Monday to Friday, 4–6 pm, $5.00 schooners (sale photo, 2022; prices then).'),
        'clock', 'noticeBoard', I('aircon', 'Air conditioner', 'Two split-system air conditioners in the bar.'), 'aircon',
        I('fireplace', 'Open fireplace', 'An open fireplace is listed among the hotel\'s features (Gday Pubs); its room is not identified.')] },
      { name: 'Bistro', w: 11, d: 9, props: [S('counter', 'Bistro counter'), 'table', 'table', 'table', 'chair', 'chair', 'chair'] },
      { name: 'Kitchen', w: 8, d: 7, props: [S('stove', 'Bistro kitchen'), 'fridge', 'kitchenSink', 'freezer'] },
      { name: 'Gaming room', w: 7, d: 6, props: [I('arcadeCabinet', 'Gaming machine 1', 'The hotel holds 3 gaming machine entitlements (JLL listing, 2022).'), I('arcadeCabinet', 'Gaming machine 2', 'One of 3 gaming machine entitlements.'), I('arcadeCabinet', 'Gaming machine 3', 'One of 3 gaming machine entitlements.')] },
      { name: 'Pool room', w: 9, d: 8, props: [I('table', 'Pool table', 'A pool room is listed among the hotel\'s features (Gday Pubs).'), 'stool', 'stool', 'noticeBoard'] },
      { name: 'Drive-through bottle shop', w: 9, d: 7, props: [S('cashRegister', 'Bottle shop counter'), 'shelf', 'shelf', 'fridge', 'crates'] },
      { name: 'Function room (upstairs, opens to the balcony)', w: 11, d: 9, props: ['table', 'table', 'chair', 'chair', I('lectern', 'Function room', 'An upstairs function room with a balcony is listed (Gday Pubs); the balcony is the iron-lace upper verandah on Dandaloo Street.')] },
      { name: 'Upstairs accommodation hallway', w: 10, d: 6, props: [I('noticeBoard', 'Pub rooms', '20 pub-style rooms upstairs and 10 ensuite motel rooms in a separate wing (JLL listing, 2022).'), 'bench'] },
    ],
  },
});
