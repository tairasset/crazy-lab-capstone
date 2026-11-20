const usgs = 'U.S. Geological Survey';
const overview = { title: usgs, locator: 'Copper overview', url: 'https://www.usgs.gov/centers/national-minerals-information-center/copper-statistics-and-information' };
const sample = { title: usgs, locator: 'A copper ore sample from Bingham Canyon', url: 'https://www.usgs.gov/media/images/usgs-mrp-color-number-chalcopyrite' };
const flotation = { title: 'International Copper Association', locator: 'Copper concentrates, production process', url: 'https://copperalliance.org/wp-content/uploads/2024/02/ICA-Copper-con-classification-guidance-1.pdf' };
const kennecott = { title: 'Rio Tinto Kennecott', locator: 'Copper cathode, production process', url: 'https://www.riotinto.com/-/media/content/documents/products/copper/rt-copper-cathode' };
const element = { title: 'Royal Society of Chemistry', locator: 'Copper properties and uses', url: 'https://periodic-table.rsc.org/element/29/Copper' };
const roofing = { title: 'Copper Development Association', locator: 'A primer on copper roofing', url: 'https://www.copper.org/publications/pub_list/pdf/a4037.pdf' };
const alloys = { title: 'Copper Development Association', locator: 'Copper alloys handbook', url: 'https://archive.copper.org/applications/architecture/arch_dhb/technical-discussion/copper_alloys/' };

export const copperMaterialNotes = ['uses', 'heat', 'shape', 'surface', 'alloys', 'recycle'];

export const quarryNotes = {
  mine: {
    title: 'Where does copper hide?',
    text: 'At Bingham Canyon in Utah, miners dig copper-bearing rock from a giant open pit. Look for the bright flecks that mark copper ore in this game.',
    comment: 'See the bright flecks? Rock that is worth mining is called ore.',
    source: sample,
  },
  crack: {
    title: 'Inside a copper rock',
    text: 'Copper can be part of a mineral nestled among other minerals. The colored flecks help you spot it in the game. Strike once more to collect it.',
    comment: 'A crack! Those copper minerals are mixed in with other rock.',
    source: sample,
  },
  ore: {
    title: 'Ore and copper metal',
    text: 'Ore is rock that contains enough useful material to be worth mining. Most copper comes from minerals such as chalcopyrite, which contains copper, iron and sulfur. Raw ore looks different from the reddish metal you get after refining.',
    comment: 'You found ore! The copper is part of minerals in the rock. You can sort them at the concentrator.',
    source: element,
  },
  concentrate: {
    title: 'Concentrator',
    text: 'First the rock is crushed into grains. In the tank, air bubbles carry grains rich in copper minerals to the top. That pile is collected and dried to make concentrate.',
    comment: 'This machine crushes the rock. Bubbles lift the grains with more copper to the top. The other rock mostly sinks. We keep the top pile. It is called concentrate!',
    source: flotation,
  },
  smelt: {
    title: 'Smelter',
    text: 'The furnace and a converter turn concentrate into rough copper metal called blister copper. Industrial plants prepare that copper and cast it into plates for the refinery. The game combines these jobs at one station.',
    comment: 'This furnace helps turn copper-rich grains into metal. Watch the glow, then the liquid metal filling the mold. The rough plate still needs cleaning.',
    source: kennecott,
  },
  refine: {
    title: 'Refiner',
    text: 'Electric current moves copper from an impure copper plate, through a liquid, onto a clean plate. Some of the impurities settle at the bottom of the tank.',
    comment: 'This tank uses electricity. Tiny pieces of copper leave the rough plate, move through the liquid and build up on the clean plate. See it grow?',
    source: kennecott,
  },
  complete: {
    title: 'Your copper plate is ready',
    text: 'Refining gives you a plate of copper metal. Copper powder is the same metal in much smaller grains. Keep mining or choose the next lab stop.',
    comment: 'A clean copper plate! You can keep mining or visit the powder lab.',
    source: overview,
  },
  uses: {
    title: 'Copper carries electricity',
    text: 'Copper lets electric current flow with little resistance. That is why there is often copper in building wiring and the coils of electric motors.',
    comment: 'Copper lets electricity flow easily. Think of the wires that carry power to a lamp.',
    source: overview,
  },
  heat: {
    title: 'Copper moves heat',
    text: 'Heat passes easily through copper. Engineers use copper tubes in some heating and cooling systems to move heat from one place to another.',
    comment: 'Copper carries heat well, too. That helps it move heat in a cooling system.',
    source: element,
  },
  shape: {
    title: 'From wire to sheet',
    text: 'Copper is ductile, meaning it can be drawn into thin wires. It is also malleable, meaning it can be pressed into sheets. Those properties make the same metal useful in cables and roofing.',
    comment: 'Copper can stretch into wire or flatten into a sheet. It changes shape and stays copper.',
    source: overview,
  },
  surface: {
    title: 'Why copper roofs turn green',
    text: 'Over time, copper reacts with the air and can develop a green surface layer called a patina. On a copper roof, this layer can slow further weathering.',
    comment: 'A copper roof can turn green over time. That surface layer is called patina.',
    source: roofing,
  },
  alloys: {
    title: 'Meet brass and bronze',
    text: 'An alloy combines a metal with other elements. Brass contains copper and zinc. Traditional bronze contains copper and tin.',
    comment: 'Mix copper with zinc and you get brass. Mix it with tin and you get traditional bronze.',
    source: alloys,
  },
  recycle: {
    title: 'Old copper gets a second life',
    text: 'Copper can be recovered from old products and factory scraps. Recycling that metal supplies some of the copper used in new products.',
    comment: 'Copper from an old wire can come back as a new copper product.',
    source: overview,
  },
};
