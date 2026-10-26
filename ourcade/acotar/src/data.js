import { VALID_GUESS_WORDS } from "./valid-guesses.js";

export const PUZZLES = [
  {
    "id": "acotar-night-1",
    "book": "ACOTAR",
    "answer": "NIGHT",
    "clue": "The court where Velaris glitters beneath a mountain of stars."
  },
  {
    "id": "acotar-thorn-2",
    "book": "ACOTAR",
    "answer": "THORN",
    "clue": "A sharp reminder hidden in the title of the first book."
  },
  {
    "id": "acotar-roses-3",
    "book": "ACOTAR",
    "answer": "ROSES",
    "clue": "Flowers that give the first book half its title."
  },
  {
    "id": "acotar-feyre-4",
    "book": "ACOTAR",
    "answer": "FEYRE",
    "clue": "The huntress whose name begins the story."
  },
  {
    "id": "acotar-faire-5",
    "book": "ACOTAR",
    "answer": "FAIRE",
    "clue": "The old-fashioned spelling of the mortal girl's world, used in the books' fairy-tale atmosphere."
  },
  {
    "id": "acotar-under-6",
    "book": "ACOTAR",
    "answer": "UNDER",
    "clue": "The word that begins the place where Feyre is imprisoned beneath the mountain."
  },
  {
    "id": "acotar-mount-7",
    "book": "ACOTAR",
    "answer": "MOUNT",
    "clue": "The mountain beneath which Amarantha rules."
  },
  {
    "id": "acotar-beast-8",
    "book": "ACOTAR",
    "answer": "BEAST",
    "clue": "What Feyre first believes her captor to be."
  },
  {
    "id": "acomaf-mates-9",
    "book": "ACOMAF",
    "answer": "MATES",
    "clue": "The bond that becomes central to Feyre's life."
  },
  {
    "id": "acomaf-dream-10",
    "book": "ACOMAF",
    "answer": "DREAM",
    "clue": "A recurring motif in the Night Court."
  },
  {
    "id": "acomaf-stars-11",
    "book": "ACOMAF",
    "answer": "STARS",
    "clue": "What Feyre paints after discovering a new life."
  },
  {
    "id": "acomaf-wings-12",
    "book": "ACOMAF",
    "answer": "WINGS",
    "clue": "What Feyre learns to use after becoming High Fae."
  },
  {
    "id": "acomaf-house-13",
    "book": "ACOMAF",
    "answer": "HOUSE",
    "clue": "A place that becomes a refuge and a home."
  },
  {
    "id": "acomaf-dream-14",
    "book": "ACOMAF",
    "answer": "DREAM",
    "clue": "The word behind the image of a city made of dreams."
  },
  {
    "id": "acowar-queen-15",
    "book": "ACOWAR",
    "answer": "QUEEN",
    "clue": "The title Amarantha carries."
  },
  {
    "id": "acowar-human-16",
    "book": "ACOWAR",
    "answer": "HUMAN",
    "clue": "The mortal state Feyre starts with."
  },
  {
    "id": "acowar-court-17",
    "book": "ACOWAR",
    "answer": "COURT",
    "clue": "The political structure of Prythian."
  },
  {
    "id": "acowar-blood-18",
    "book": "ACOWAR",
    "answer": "BLOOD",
    "clue": "What marks the cost of war."
  },
  {
    "id": "acowar-power-19",
    "book": "ACOWAR",
    "answer": "POWER",
    "clue": "What the High Lords wield."
  },
  {
    "id": "acofas-snowy-20",
    "book": "ACOFAS",
    "answer": "SNOWY",
    "clue": "A fitting Winter Solstice adjective."
  },
  {
    "id": "acofas-gifts-21",
    "book": "ACOFAS",
    "answer": "GIFTS",
    "clue": "What friends exchange during the Solstice."
  },
  {
    "id": "acofas-party-22",
    "book": "ACOFAS",
    "answer": "PARTY",
    "clue": "The kind of celebration the Night Court hosts."
  },
  {
    "id": "acofas-stars-23",
    "book": "ACOFAS",
    "answer": "STARS",
    "clue": "A recurring Night Court image."
  },
  {
    "id": "acofas-light-24",
    "book": "ACOFAS",
    "answer": "LIGHT",
    "clue": "A thematic counterpoint to darkness."
  },
  {
    "id": "acosf-flame-25",
    "book": "ACOSF",
    "answer": "FLAME",
    "clue": "A force associated with Nesta's power."
  },
  {
    "id": "acosf-ember-26",
    "book": "ACOSF",
    "answer": "EMBER",
    "clue": "A lingering spark, fitting Nesta's elemental imagery."
  },
  {
    "id": "acosf-house-27",
    "book": "ACOSF",
    "answer": "HOUSE",
    "clue": "The House of Wind becomes central to Nesta's story."
  },
  {
    "id": "acosf-tower-28",
    "book": "ACOSF",
    "answer": "TOWER",
    "clue": "The place of Nesta's grueling training."
  },
  {
    "id": "acosf-rings-29",
    "book": "ACOSF",
    "answer": "RINGS",
    "clue": "Objects tied to Valkyrie training and friendship."
  },
  {
    "id": "acosf-sword-30",
    "book": "ACOSF",
    "answer": "SWORD",
    "clue": "A weapon central to Cassian and Nesta's world."
  },
  {
    "id": "acosf-mates-31",
    "book": "ACOSF",
    "answer": "MATES",
    "clue": "The bond Nesta's story eventually embraces."
  },
  {
    "id": "acosf-wings-32",
    "book": "ACOSF",
    "answer": "WINGS",
    "clue": "The Illyrian warriors' defining feature."
  },
  {
    "id": "acosf-heart-33",
    "book": "ACOSF",
    "answer": "HEART",
    "clue": "What Nesta has to confront beyond strength."
  },
  {
    "id": "acosf-stone-34",
    "book": "ACOSF",
    "answer": "STONE",
    "clue": "A recurring material in the House and ancient magic."
  },
  {
    "id": "acotar-gates-35",
    "book": "ACOTAR",
    "answer": "GATES",
    "clue": "The magical passages Feyre learns can connect worlds and courts."
  },
  {
    "id": "acotar-farms-36",
    "book": "ACOTAR",
    "answer": "FARMS",
    "clue": "Where Feyre's family struggles before her bargain changes everything."
  },
  {
    "id": "acotar-names-37",
    "book": "ACOTAR",
    "answer": "NAMES",
    "clue": "Something the Suriel and other beings make very important."
  },
  {
    "id": "acotar-grace-38",
    "book": "ACOTAR",
    "answer": "GRACE",
    "clue": "A quality associated with the Fae's beauty and bearing."
  },
  {
    "id": "acotar-heart-39",
    "book": "ACOTAR",
    "answer": "HEART",
    "clue": "What Feyre fears losing to the cruelty of her new world."
  },
  {
    "id": "acotar-teeth-40",
    "book": "ACOTAR",
    "answer": "TEETH",
    "clue": "A beast's detail that helps sell Tamlin's frightening first impression."
  },
  {
    "id": "acotar-sword-41",
    "book": "ACOTAR",
    "answer": "SWORD",
    "clue": "A weapon belongs in the dangerous world beyond the Wall."
  },
  {
    "id": "acotar-trial-42",
    "book": "ACOTAR",
    "answer": "TRIAL",
    "clue": "What Feyre must survive beneath the mountain."
  },
  {
    "id": "acomaf-stars-43",
    "book": "ACOMAF",
    "answer": "STARS",
    "clue": "The image Rhysand uses to describe a treasured future."
  },
  {
    "id": "acomaf-dream-44",
    "book": "ACOMAF",
    "answer": "DREAM",
    "clue": "The Night Court is a city of these."
  },
  {
    "id": "acomaf-night-45",
    "book": "ACOMAF",
    "answer": "NIGHT",
    "clue": "The court Feyre ultimately chooses."
  },
  {
    "id": "acomaf-court-46",
    "book": "ACOMAF",
    "answer": "COURT",
    "clue": "Where High Lords rule and alliances are made."
  },
  {
    "id": "acomaf-power-47",
    "book": "ACOMAF",
    "answer": "POWER",
    "clue": "Feyre begins learning what her new gifts can do."
  },
  {
    "id": "acomaf-music-48",
    "book": "ACOMAF",
    "answer": "MUSIC",
    "clue": "A part of the Night Court's joy and celebration."
  },
  {
    "id": "acomaf-wings-49",
    "book": "ACOMAF",
    "answer": "WINGS",
    "clue": "What Feyre gains and learns to command."
  },
  {
    "id": "acomaf-dream-50",
    "book": "ACOMAF",
    "answer": "DREAM",
    "clue": "What Velaris represents to its High Lord."
  },
  {
    "id": "acowar-queen-51",
    "book": "ACOWAR",
    "answer": "QUEEN",
    "clue": "Amarantha's title, remembered long after her reign."
  },
  {
    "id": "acowar-human-52",
    "book": "ACOWAR",
    "answer": "HUMAN",
    "clue": "The people Feyre once counted herself among."
  },
  {
    "id": "acowar-power-53",
    "book": "ACOWAR",
    "answer": "POWER",
    "clue": "What the High Lords gather and guard."
  },
  {
    "id": "acowar-blood-54",
    "book": "ACOWAR",
    "answer": "BLOOD",
    "clue": "The price of war is repeatedly written in it."
  },
  {
    "id": "acowar-arrow-55",
    "book": "ACOWAR",
    "answer": "ARROW",
    "clue": "A weapon that belongs on a battlefield."
  },
  {
    "id": "acowar-siege-56",
    "book": "ACOWAR",
    "answer": "SIEGE",
    "clue": "The war brings armies and fortifications into focus."
  },
  {
    "id": "acowar-scout-57",
    "book": "ACOWAR",
    "answer": "SCOUT",
    "clue": "A role useful when gathering intelligence."
  },
  {
    "id": "acowar-peace-58",
    "book": "ACOWAR",
    "answer": "PEACE",
    "clue": "What the surviving courts desperately need."
  },
  {
    "id": "acowar-ruler-59",
    "book": "ACOWAR",
    "answer": "RULER",
    "clue": "A High Lord is one kind of this."
  },
  {
    "id": "acowar-flock-60",
    "book": "ACOWAR",
    "answer": "FLOCK",
    "clue": "A group of winged creatures or warriors."
  },
  {
    "id": "acowar-river-61",
    "book": "ACOWAR",
    "answer": "RIVER",
    "clue": "A natural boundary and a recurring landscape element."
  },
  {
    "id": "acofas-snowy-62",
    "book": "ACOFAS",
    "answer": "SNOWY",
    "clue": "The Winter Solstice arrives in the cold season."
  },
  {
    "id": "acofas-gifts-63",
    "book": "ACOFAS",
    "answer": "GIFTS",
    "clue": "Objects exchanged during the Solstice."
  },
  {
    "id": "acofas-party-64",
    "book": "ACOFAS",
    "answer": "PARTY",
    "clue": "A celebration in the Night Court."
  },
  {
    "id": "acofas-light-65",
    "book": "ACOFAS",
    "answer": "LIGHT",
    "clue": "A visual counterpoint to the dark winter."
  },
  {
    "id": "acofas-feast-66",
    "book": "ACOFAS",
    "answer": "FEAST",
    "clue": "A holiday table calls for one."
  },
  {
    "id": "acofas-quiet-67",
    "book": "ACOFAS",
    "answer": "QUIET",
    "clue": "A needed pause after the war."
  },
  {
    "id": "acofas-renew-68",
    "book": "ACOFAS",
    "answer": "RENEW",
    "clue": "What the rebuilding world tries to do."
  },
  {
    "id": "acofas-stars-69",
    "book": "ACOFAS",
    "answer": "STARS",
    "clue": "A familiar Night Court ceiling."
  },
  {
    "id": "acosf-flame-70",
    "book": "ACOSF",
    "answer": "FLAME",
    "clue": "A word that fits Nesta's fierce power."
  },
  {
    "id": "acosf-ember-71",
    "book": "ACOSF",
    "answer": "EMBER",
    "clue": "A glowing remnant, fitting the book's fire imagery."
  },
  {
    "id": "acosf-house-72",
    "book": "ACOSF",
    "answer": "HOUSE",
    "clue": "The House of Wind becomes a character-like presence."
  },
  {
    "id": "acosf-tower-73",
    "book": "ACOSF",
    "answer": "TOWER",
    "clue": "The training begins high above Velaris."
  },
  {
    "id": "acosf-sword-74",
    "book": "ACOSF",
    "answer": "SWORD",
    "clue": "A blade tied to the Illyrian warriors."
  },
  {
    "id": "acosf-heart-75",
    "book": "ACOSF",
    "answer": "HEART",
    "clue": "Nesta's emotional journey is ultimately about opening it."
  },
  {
    "id": "acosf-stone-76",
    "book": "ACOSF",
    "answer": "STONE",
    "clue": "The ancient prison and mountain imagery make stone unavoidable."
  },
  {
    "id": "acosf-trial-77",
    "book": "ACOSF",
    "answer": "TRIAL",
    "clue": "Nesta's path is filled with tests of endurance."
  },
  {
    "id": "acosf-mates-78",
    "book": "ACOSF",
    "answer": "MATES",
    "clue": "The mating bond is part of the romantic stakes."
  },
  {
    "id": "acosf-wings-79",
    "book": "ACOSF",
    "answer": "WINGS",
    "clue": "Illyrian warriors are defined by theirs."
  },
  {
    "id": "acosf-sweat-80",
    "book": "ACOSF",
    "answer": "SWEAT",
    "clue": "A great deal of it is produced in Valkyrie training."
  },
  {
    "id": "acotar-walls-81",
    "book": "ACOTAR",
    "answer": "WALLS",
    "clue": "Five letters? No, WALLS is five. The barrier separating mortal lands from Prythian."
  },
  {
    "id": "acotar-mercy-82",
    "book": "ACOTAR",
    "answer": "MERCY",
    "clue": "Something Feyre must learn to give and receive."
  },
  {
    "id": "acotar-heirs-83",
    "book": "ACOTAR",
    "answer": "HEIRS",
    "clue": "Those who may inherit titles and courts."
  },
  {
    "id": "acomaf-image-84",
    "book": "ACOMAF",
    "answer": "IMAGE",
    "clue": "Feyre paints scenes and symbols to process what she feels."
  },
  {
    "id": "acomaf-canal-85",
    "book": "ACOMAF",
    "answer": "CANAL",
    "clue": "Velaris is threaded with waterways."
  },
  {
    "id": "acomaf-dream-86",
    "book": "ACOMAF",
    "answer": "DREAM",
    "clue": "A central word for the city and its people."
  },
  {
    "id": "acomaf-storm-87",
    "book": "ACOMAF",
    "answer": "STORM",
    "clue": "The emotional and political upheaval surrounding Feyre."
  },
  {
    "id": "acowar-armor-88",
    "book": "ACOWAR",
    "answer": "ARMOR",
    "clue": "The practical shell of warriors going to battle."
  },
  {
    "id": "acowar-horse-89",
    "book": "ACOWAR",
    "answer": "HORSE",
    "clue": "A familiar means of travel in Prythian."
  },
  {
    "id": "acowar-crown-90",
    "book": "ACOWAR",
    "answer": "CROWN",
    "clue": "A symbol of rule and power."
  },
  {
    "id": "acowar-rally-91",
    "book": "ACOWAR",
    "answer": "RALLY",
    "clue": "What allies must do before a war."
  },
  {
    "id": "acofas-feast-92",
    "book": "ACOFAS",
    "answer": "FEAST",
    "clue": "A holiday meal in the Night Court."
  },
  {
    "id": "acosf-music-93",
    "book": "ACOSF",
    "answer": "MUSIC",
    "clue": "Something Nesta finds again as she rebuilds her life."
  },
  {
    "id": "acosf-train-94",
    "book": "ACOSF",
    "answer": "TRAIN",
    "clue": "What the Valkyries do relentlessly."
  },
  {
    "id": "acosf-brave-95",
    "book": "ACOSF",
    "answer": "BRAVE",
    "clue": "A quality Nesta learns to embody."
  },
  {
    "id": "acosf-risen-96",
    "book": "ACOSF",
    "answer": "RISEN",
    "clue": "A fitting word for someone rebuilding herself."
  },
  {
    "id": "acosf-forge-97",
    "book": "ACOSF",
    "answer": "FORGE",
    "clue": "Where legendary blades and objects can be made."
  }
];

const COMMON = `
ABOUT ABOVE ABUSE ADMIT ADOPT AFTER AGAIN AGENT AGREE AHEAD ALIVE ALLOW ALONE ALONG
ARISE ARROW ASIDE AWAKE AWARE BADLY BASIC BEACH BEGIN BELOW BENCH BLACK BLADE BLAME
BLANK BLAST BLESS BLIND BLOOD BOARD BRAIN BRAND BRAVE BREAD BREAK BRING BROKE BUILD
BUYER CARRY CATCH CAUSE CHAIN CHAIR CHARM CHASE CHEST CHILD CHOSE CLAIM CLASS CLEAN
CLEAR CLIMB CLOCK CLOSE CLOUD COULD COUNT COURT COVER CRAFT CRASH CREAM CRIME CROSS
CROWN CURSE DANCE DEALT DEATH DEPTH DREAM DRESS DRINK DRIVE EARTH EIGHT EMPTY ENEMY
ENJOY ENTER EQUAL EVENT EVERY EXIST EXTRA FAITH FALSE FEAST FIELD FIFTH FIGHT FINAL
FIRST FLAME FLESH FLOOR FLOWER FORCE FORGE FOUND FRAME FRESH FRONT FRUIT GIVEN GLASS
GLOOM GRACE GRADE GRANT GRASS GREAT GREEN GUEST GUIDE HEART HEAVY HIDDEN HORSE HOUSE
HUMAN HUNT HURRY IMAGE INNER ISSUE JUDGE KNIFE KNOWN LARGE LAUGH LEARN LEAST LEAVE
LIGHT LIMIT LOCAL LOVED LOWER MAGIC MAJOR MAKER MARCH MATCH MAYBE MERCY MIGHT MINOR
MONEY MONTH MOUNT MOUTH MUSIC NEVER NIGHT NOISE NORTH NOVEL NURSE OFFER OFTEN ORDER
OTHER PAINT PARTY PEACE PHASE PHONE PLACE PLANE PLANT PLATE POINT POWER PRESS PRICE
PRIDE PRIME PROUD QUEEN QUICK QUIET RAISE RANGE RAVEN REACH READY REALM REPLY RIGHT
RIVER ROSES ROUND RULER SAINT SCENT SCOUT SHAPE SHARE SHARP SHEET SHELF SHIFT SHINE
SHORT SHOUT SIEGE SIGNS SILLY SINCE SIXTH SLEEP SMALL SMILE SMOKE SOLID SOUTH SPACE
SPEAK SPEED SPEND SPICE SPLIT SPORT STAGE STARS START STATE STEEL STONE STOOD STORM
STORY STRIP STUDY SUGAR SUITE SWEAT SWORD TABLE TAKEN TEETH THANK THEIR THERE THESE
THICK THING THINK THIRD THORN THOSE THREE THROW TIGER TITLE TODAY TOGETHER TOOLS TOWER
TRIAL TRUST TRUTH TWICE UNDER UNION UNTIL UPPER USUAL VALUE VOICE WASTE WATCH WATER
WHEEL WHERE WHICH WHILE WHITE WHOLE WOMAN WORLD WORRY WORSE WRITE WRONG YOUTH
`;
export const VALID_GUESSES = new Set([
  ...COMMON.trim().split(/\s+/).filter(word => /^[A-Z]{5}$/.test(word)),
  ...VALID_GUESS_WORDS,
  ...PUZZLES.map(p => p.answer)
]);
