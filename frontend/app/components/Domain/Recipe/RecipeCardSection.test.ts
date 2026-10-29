import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, describe, expect, test, vi } from "vitest";
import RecipeCardSection from "./RecipeCardSection.vue";
import type { Recipe } from "~/lib/api/types/recipe";

// Mock Nuxt / Vue composables used in RecipeCardSection
vi.mock("vuetify", () => ({
  useDisplay: () => ({
    smAndDown: { value: false },
    xs: { value: false },
  }),
}));

vi.mock("~/composables/use-logged-in-state", () => ({
  useLoggedInState: () => ({
    isOwnGroup: { value: true },
  }),
}));

vi.mock("~/composables/use-mealie-auth", () => ({
  useMealieAuth: () => ({
    user: { value: { groupSlug: "home" } },
  }),
}));

vi.mock("~/composables/recipes", () => ({
  useLazyRecipes: () => ({
    fetchMore: vi.fn().mockResolvedValue([]),
    getRandom: vi.fn().mockResolvedValue(null),
  }),
}));

vi.mock("~/composables/use-users/preferences", () => ({
  useUserSortPreferences: () => ({
    value: {
      useMobileCards: false,
      orderBy: "name",
      orderDirection: "asc",
      sortIcon: "sort-icon",
    },
  }),
}));

vi.mock("~/composables/use-utils", () => ({
  useScrollPosition: () => ({
    savePosition: vi.fn(),
    getSavedPage: vi.fn().mockReturnValue(null),
    restorePosition: vi.fn(),
  }),
}));

vi.stubGlobal("useRoute", () => ({
  path: "/recipes",
  params: {},
}));

vi.stubGlobal("useRouter", () => ({
  push: vi.fn(),
}));

const mockIcons = {
  silverwareForkKnife: "silverware",
  tags: "tags",
  categories: "categories",
  potSteam: "potSteam",
  foods: "foods",
  diceMultiple: "dice",
  eye: "eye",
  sortAscending: "sort-asc",
  sortDescending: "sort-desc",
  sortAlphabeticalAscending: "sort-alpha-asc",
  orderAlphabeticalAscending: "order-alpha-asc",
  newBox: "new-box",
  star: "star",
  chefHat: "chef-hat",
  clockOutline: "clock",
  update: "update",
};

const mockI18nDict: Record<string, string> = {
  "general.recipes": "Recipes",
  "general.random": "Random",
  "general.sort": "Sort",
  "general.toggle-view": "Toggle View",
  "general.none": "None",
  "general.uncategorized-recipes": "Uncategorized Recipes",
  "general.untagged-recipes": "Untagged Recipes",
  "general.no-tools": "No Tools",
  "general.no-foods": "No Foods",
  "general.loading-recipes": "Loading Recipes",
};

vi.stubGlobal("useNuxtApp", () => ({
  $globals: {
    icons: mockIcons,
  },
}));

vi.stubGlobal("useI18n", () => ({
  t: (key: string) => mockI18nDict[key] || key,
}));

const wrappers: VueWrapper[] = [];

function mountSection(props: any) {
  const wrapper = mount(RecipeCardSection, {
    props,
    global: {
      mocks: {
        $vuetify: {
          display: {
            xs: false,
            smAndDown: false,
          },
        },
        $globals: {
          icons: mockIcons,
        },
      },
      stubs: {
        RecipeCard: {
          props: ["name", "slug", "recipeId", "tags"],
          template: "<div class=\"recipe-card\" :data-name=\"name\" :data-id=\"recipeId\">{{ name }}</div>",
        },
        RecipeCardMobile: {
          props: ["name", "slug", "recipeId", "tags"],
          template: "<div class=\"recipe-card-mobile\" :data-name=\"name\" :data-id=\"recipeId\">{{ name }}</div>",
        },
        ContextMenu: {
          template: "<div class=\"context-menu\" />",
        },
        AppLoader: {
          template: "<div class=\"app-loader\" />",
        },
        AppScrollToTop: {
          template: "<div class=\"app-scroll-to-top\" />",
        },
        VRow: {
          template: "<div class=\"v-row\"><slot /></div>",
        },
        VCol: {
          template: "<div class=\"v-col\"><slot /></div>",
        },
        VIcon: {
          template: "<span class=\"v-icon\"><slot /></span>",
        },
        VBtn: {
          template: "<button type=\"button\"><slot /></button>",
        },
        VMenu: {
          template: "<div><slot /><slot name=\"activator\" :props=\"{}\" /></div>",
        },
        VList: {
          template: "<div><slot /></div>",
        },
        VListItem: {
          template: "<div><slot /><slot name=\"title\" /></div>",
        },
        VListItemTitle: {
          template: "<div><slot /></div>",
        },
        VSpacer: {
          template: "<div class=\"v-spacer\" />",
        },
        VChip: {
          template: "<span class=\"v-chip\"><slot /></span>",
        },
        VCard: {
          template: "<div class=\"v-card\" />",
        },
        VFadeTransition: {
          template: "<div><slot /></div>",
        },
      },
      directives: {
        intersect: () => {},
      },
    },
  });

  wrappers.push(wrapper);
  return wrapper;
}

describe("RecipeCardSection grouping", () => {
  afterEach(() => {
    wrappers.forEach(w => w.unmount());
    wrappers.length = 0;
  });

  const sampleRecipes: Recipe[] = [
    {
      id: "r1",
      name: "Pancake",
      slug: "pancake",
      recipeCategory: [
        { id: "c1", name: "Breakfast", slug: "breakfast" },
        { id: "c2", name: "Quick Meals", slug: "quick-meals" },
      ],
      tags: [
        { id: "t1", name: "Sweet", slug: "sweet" },
        { id: "t2", name: "Easy", slug: "easy" },
      ],
      tools: [{ id: "tl1", name: "Pan", slug: "pan" }],
      foods: [{ id: "f1", name: "Flour" }, { id: "f2", name: "Milk" }],
    } as any,
    {
      id: "r2",
      name: "Omelette",
      slug: "omelette",
      recipeCategory: [{ id: "c1", name: "Breakfast", slug: "breakfast" }],
      tags: [{ id: "t2", name: "Easy", slug: "easy" }],
      tools: [{ id: "tl1", name: "Pan", slug: "pan" }],
      foods: [{ id: "f3", name: "Egg" }],
    } as any,
    {
      id: "r3",
      name: "Plain Water",
      slug: "plain-water",
      recipeCategory: [],
      tags: [],
      tools: [],
      foods: [],
    } as any,
  ];

  test("renders ungrouped recipes in a single section when groupBy is empty", async () => {
    const wrapper = mountSection({
      title: "Recipes",
      recipes: sampleRecipes,
      groupBy: "",
    });
    await flushPromises();

    const cards = wrapper.findAll(".recipe-card");
    expect(cards).toHaveLength(3);
    expect(wrapper.text()).toContain("Recipes");
  });

  test("groups recipes by category with sections and repeats recipes with multiple categories", async () => {
    const wrapper = mountSection({
      title: "Recipes",
      recipes: sampleRecipes,
      groupBy: "category",
    });
    await flushPromises();

    const text = wrapper.text();
    expect(text).toContain("Breakfast");
    expect(text).toContain("Quick Meals");
    expect(text).toContain("Uncategorized Recipes");

    // Pancake should appear in Breakfast and Quick Meals (repeated)
    // Omelette should appear in Breakfast
    // Plain Water in Uncategorized Recipes
    const cards = wrapper.findAll(".recipe-card");
    expect(cards).toHaveLength(4); // 2 in Breakfast + 1 in Quick Meals + 1 in Uncategorized
  });

  test("groups recipes by tag with sections and repeats recipes with multiple tags", async () => {
    const wrapper = mountSection({
      title: "Recipes",
      recipes: sampleRecipes,
      groupBy: "tag",
    });
    await flushPromises();

    const text = wrapper.text();
    expect(text).toContain("Easy");
    expect(text).toContain("Sweet");
    expect(text).toContain("Untagged Recipes");

    const cards = wrapper.findAll(".recipe-card");
    // Pancake in Easy + Sweet (2)
    // Omelette in Easy (1)
    // Plain Water in Untagged (1)
    expect(cards).toHaveLength(4);
  });

  test("groups recipes by tool", async () => {
    const wrapper = mountSection({
      title: "Recipes",
      recipes: sampleRecipes,
      groupBy: "tool",
    });
    await flushPromises();

    const text = wrapper.text();
    expect(text).toContain("Pan");
    expect(text).toContain("No Tools");

    const cards = wrapper.findAll(".recipe-card");
    // Pancake and Omelette in Pan (2) + Plain Water in No Tools (1)
    expect(cards).toHaveLength(3);
  });

  test("groups recipes by food and repeats across ingredients", async () => {
    const wrapper = mountSection({
      title: "Recipes",
      recipes: sampleRecipes,
      groupBy: "food",
    });
    await flushPromises();

    const text = wrapper.text();
    expect(text).toContain("Flour");
    expect(text).toContain("Milk");
    expect(text).toContain("Egg");
    expect(text).toContain("No Foods");

    const cards = wrapper.findAll(".recipe-card");
    // Pancake in Flour (1), Pancake in Milk (1), Omelette in Egg (1), Plain Water in No Foods (1)
    expect(cards).toHaveLength(4);
  });
});
