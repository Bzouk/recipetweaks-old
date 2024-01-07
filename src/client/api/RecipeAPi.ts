/**
 * @noSelfInFile
 *
 * NOTE: Use this at the top of your TypeScript files. This prevents functions & methods
 *       from prepending a 'self' reference, which is usually not necessary and complicates
 *       rendered Lua code.
 */

import { getScriptManager, Item, Recipe, Result, Source, Keyboard, getPlayer, getGameSpeed } from "@asledgehammer/pipewrench";
// PipeWrench Events API.
import * as Events from "@asledgehammer/pipewrench-events";
/*
interface GeneralObject {
  [key: string]: any
}

interface Dictionary<U> {
  [key: string]: U;
}

interface User extends GeneralObject {
  id: number;
  name: string;
  data: GeneralObject;
}
let user: User[] = [
  {
    id:1,
    name:"Ku",
    data:{}
  }
]

let users: Dictionary<User> = {
  Josh : {
    id:1,
    name:"Ku",
    data:{}
  },
}
*/
/**
 * NORULE = 0
 * DESTROY = 1
 * NODESTROY = 2
 * KEEP = 3
 * NOKEEP = 4
 */



//declare let NEW_GLOBAL: string;
//export const ss = WhenAdd2.DESTROY
//NEW_GLOBAL = "5"

export  enum WhenAdd {
  NORULE,
  DESTROY,
  NODESTROY,
  KEEP,
  NOKEEP
}

interface RecipeChanges {
  filter?: RecipeFilter;
  sourceChange?: RecipeSourceChanges;
  resultChanges?: RecipeResultChanges;
}

interface RecipeFilter {
  resultName?: string;
  resultCount?: number;
  modName?: string;
  includeRecipeNames?: Array<string>;
  excludeRecipeNames?: Array<string>;
}

interface RecipeResultChanges {
  resultDrainableCount?: number;
  resultCount?: number;
}

interface RecipeSourceChanges {
  sourceItem: string;
  sourcesNewItemsList?: Array<string>;
  sourceCount?: number;
  sourceDrainableCount?: number;
  whenadd?: WhenAdd;
}

//==============================================================================
const isNotEmptyString = (data?: string): boolean => data != null && typeof data === "string" && data.trim().length > 0;
/*
export function testStringEmpty() {
  print("null " + isNotEmptyString(undefined))
  print("empty " + isNotEmptyString(""))
  print("empty white " + isNotEmptyString("  "))
   print("empty white " + isNotEmptyString(" jj "))
}
*/
const TweakOneRecipeData = new Map<string, Array<RecipeChanges>>();
const TweakAllRecipeData: RecipeChanges[] = [];

//==============================================================================
function modifiRecipeResult(recipe: Recipe, resultChanges?: RecipeResultChanges): void {
	if (resultChanges == null) return;  // Return early if result changes are unspecified
  // Check if result count has been specified and is greater than 0
	if (resultChanges.resultCount != null && resultChanges.resultCount > 0) {
		// Get the recipe's result as type Result
		const result = recipe.getResult() as Result;
		// Set the result count to the specified value
		result.setCount(resultChanges.resultCount);
	}
  // Check if drainable result count has been specified and is greater than 0
	if (resultChanges.resultDrainableCount != null && resultChanges.resultDrainableCount > 0) {
		// Set the drainable result count to the specified value
		recipe.getResult().setDrainableCount(resultChanges.resultDrainableCount);
	}
}

function modifiRecipeSource(recipe: Recipe, sourceChange?: RecipeSourceChanges) {
  if (sourceChange == null || sourceChange.sourceItem == null) {
    return;
  }
  // for each source  in recipe trying to find item alt_target in source items
  const recipeSources = recipe.getSource();
  for (let index_source = 0; index_source < recipeSources.size(); index_source++) {
    const source = recipeSources.get(index_source) as Source;
    let isSourceMatch = false;
    const sourceItems = source.getItems();
    // iterate over items in source
    for (let index = 0; index < sourceItems.size(); index++) {
      const sourceItem = sourceItems.get(index) as string;
      if (sourceItem === sourceChange.sourceItem) {
        isSourceMatch = true; // item found
        break;
      }
    }

    if (isSourceMatch) {
      /**
       * Check when add
       */
      if (sourceChange.whenadd != null) {
        if (sourceChange.whenadd == WhenAdd.DESTROY && !source.isDestroy()) {
          break;
        } else if (sourceChange.whenadd == WhenAdd.NODESTROY && source.isDestroy()) {
          break;
        } else if (sourceChange.whenadd == WhenAdd.KEEP && !source.isKeep()) {
          break;
        } else if (sourceChange.whenadd == WhenAdd.NOKEEP && source.isKeep()) {
          break;
        }
      }
      // change source count or drainableCount
      if (sourceChange.sourceCount != null) {
        source.setCount(sourceChange.sourceCount);
      }
      if (sourceChange.sourceDrainableCount != null) {
        source.setUse(sourceChange.sourceDrainableCount);
      }

      // Add items to source
      if (sourceChange.sourcesNewItemsList != null) {
        sourceChange.sourcesNewItemsList.forEach((newSourcesItem) => {
          if (!sourceItems.contains(newSourcesItem)) {
            sourceItems.add(newSourcesItem);
          }
        });
        break;
      }
    }
  }
}

function modifyRecipe(recipe: Recipe, recipeChanges: Array<RecipeChanges>) {
  recipeChanges.forEach((recipeChange) => {
    if (!filterApply(recipe, recipeChange.filter)) {
      modifiRecipeSource(recipe, recipeChange.sourceChange);
      modifiRecipeResult(recipe, recipeChange.resultChanges);
    }
  });
}

function filterApply(recipe: Recipe, filter?: RecipeFilter): boolean {
  if (filter != null) {
    if (isNotEmptyString(filter.modName) && recipe.getModule().getName() != filter.modName) {
      return true;
    }
    if (isNotEmptyString(filter.resultName)) {
      const result = recipe.getResult() as Result;
      // if filter and we have resultName thne result should by not null
      // and match resultName
      if (result == null || result.getFullType() !== filter.resultName) {
        return true;
      }
    }
    if (filter.resultCount != null) {
      const result = recipe.getResult() as Result;
      if (result == null || result.getCount() !== filter.resultCount) {
        return true;
      }
    }
    if (filter.includeRecipeNames != null) {
      if (filter.includeRecipeNames.indexOf(recipe.getModule().getName() + "." + recipe.getOriginalname()) === -1) {
        return true;
      }
    }
    if (filter.excludeRecipeNames != null) {
      if (filter.excludeRecipeNames.indexOf(recipe.getModule().getName() + "." + recipe.getOriginalname()) !== -1) {
        return true;
      }
    }
  }
  return false;
}
//==============================================================================
//==============================================================================
function TweakOneRecipe() {
  // key -> recipeName, value -> list of changes
  TweakOneRecipeData.forEach((recipeChanges: Array<RecipeChanges>, key: string) => {
    const recipe = getScriptManager().getRecipe(key);
    if (recipe != null) {
      modifyRecipe(recipe, recipeChanges);
    }
  });
}

/**
 * Change only one recipe
 * @param recipeName Recipe name ("Hydrocraft.Make Tailor's Workbench)
 * @param sourceCountChanges object of source change, use CreateRecipeSourceChanges(...)
 * @param resultChanges object resultchanges, use CreateResultChanges(...)
 * @param filter filter to filter recipes, use CreateFilter(...)
 */
export function AddTweakOneRecipe(
  recipeName: string,
  sourceCountChanges?: RecipeSourceChanges,
  resultChanges?: RecipeResultChanges,
  filter?: RecipeFilter
) {
  if (!TweakOneRecipeData.has(recipeName)) {
    TweakOneRecipeData.set(recipeName, []);
  }
  TweakOneRecipeData.get(recipeName)?.push({
    resultChanges: resultChanges,
    sourceChange: sourceCountChanges,
    filter: filter
  });
}
//==============================================================================
//==============================================================================
//==============================================================================
function TweakAllRecipe() {
  const recipes = getScriptManager().getAllRecipes();
  for (let index = 0; index < recipes.size(); index++) {
    const recipe = recipes.get(index);
    modifyRecipe(recipe, TweakAllRecipeData);
  }
}

/**
 * Changes all recipes, use filter to specifi what recipes to change
 * @param sourceCountChanges object of source change, use CreateRecipeSourceChanges(...)
 * @param resultChanges object resultchanges, use CreateResultChanges(...)
 * @param filter filter to filter recipes, use CreateFilter(...)
 */
export function AddTweakAllRecipe(sourceCountChanges?: RecipeSourceChanges, resultChanges?: RecipeResultChanges, filter?: RecipeFilter) {
  TweakAllRecipeData.push({
    resultChanges: resultChanges,
    sourceChange: sourceCountChanges,
    filter: filter
  });
}

//==============================================================================
//==============================================================================
/**
 *
 * @param typeTag Can by found in recipe.lua (FishMeat,RiceRecipe,CanOpener....)
 * @returns  string list of items names
 */
export function GetItemsListByTag(typeTag: string): string[] {
  const itemsFromType = getScriptManager().getItemsTag(typeTag);
  if (itemsFromType.isEmpty()) {
    return [];
  }
  const listOfItems: string[] = [];
  for (let index = 0; index < itemsFromType.size(); index++) {
    const item = itemsFromType.get(index) as Item;
    listOfItems.push(item.getFullName());
  }
  return listOfItems;
}

/**
 * Create filter for filtering recipes
 * @param modName filter by mod name like "Hydrcraft"
 * @param includeRecipeNames list of names like  ["Hydrocraft.Make Bottle of Juice"] to include in change
 * @param excludeRecipeNames list of names like  ["Hydrocraft.Make Bottle of Juice"] to exclude in change
 * @param resultName Name of result to match in recipe "Hydrocraft.Make Bottle of Juice"
 * @param resultCount number of result like 3
 * @returns  return filter object
 */
export function CreateFilter(
  modName?: string,
  includeRecipeNames?: Array<string>,
  excludeRecipeNames?: Array<string>,
  resultName?: string,
  resultCount?: string | number
): RecipeFilter {
  const recipeFilter: RecipeFilter = {};
  if (modName != undefined && typeof modName === "string") {
    recipeFilter.modName = modName;
  }
  if (resultName != undefined && typeof resultName === "string") {
    recipeFilter.resultName = resultName;
  }
  if (resultCount != undefined && (typeof resultCount === "string" || typeof resultCount === "number")) {
    recipeFilter.resultCount = tonumber(resultCount);
  }
  if (includeRecipeNames != null && typeof includeRecipeNames === "object") {
    recipeFilter.includeRecipeNames = includeRecipeNames;
  }
  if (excludeRecipeNames != null && typeof excludeRecipeNames === "object") {
    recipeFilter.excludeRecipeNames = excludeRecipeNames;
  }
  return recipeFilter;
}

/**
 * Cahnging result count
 * @param resultCount
 * @param resultDrainableCount
 * @returns
 */
export function CreateResultChanges(resultCount?: number | string, resultDrainableCount?: number | string): RecipeResultChanges {
  const resultChanges: RecipeResultChanges = {};
  if (resultCount != undefined && (typeof resultCount === "string" || typeof resultCount === "number")) {
    resultChanges.resultCount = tonumber(resultCount);
  }
  if (resultDrainableCount != undefined && (typeof resultDrainableCount === "string" || typeof resultDrainableCount === "number")) {
    resultChanges.resultDrainableCount = tonumber(resultDrainableCount);
  }
  return resultChanges;
}

/**
 * Changes for recipe source (inputs), adding alternatives
 * @param sourceItem name of item to find in recipe
 * @param sourcesNewItemsList  list of alternatives to add to sourceItem
 * @param sourceCount change source count
 * @param sourceDrainableCount   change source Drainable
 * @param whenadd enum of when to change source ( )
 * @returns object of source changes
 */
 export function CreateRecipeSourceChanges(
  sourceItem: string,
  sourcesNewItemsList?: Array<string>,
  sourceCount?: string | number,
  sourceDrainableCount?: string | number,
  whenadd?: WhenAdd
): RecipeSourceChanges {
  const recipeSourceChanges: RecipeSourceChanges = { sourceItem: sourceItem };
  if (sourceCount != undefined && (typeof sourceCount === "string" || typeof sourceCount === "number")) {
    recipeSourceChanges.sourceCount = tonumber(sourceCount);
  }
  if (sourceDrainableCount != undefined && (typeof sourceDrainableCount === "string" || typeof sourceDrainableCount === "number")) {
    recipeSourceChanges.sourceDrainableCount = tonumber(sourceDrainableCount);
  }
  if (sourcesNewItemsList != undefined && typeof sourcesNewItemsList === "object") {
    recipeSourceChanges.sourcesNewItemsList = sourcesNewItemsList;
  }
  recipeSourceChanges.whenadd = whenadd;

  return recipeSourceChanges;
}
//==============================================================================
//==============================================================================

// Add all initialization code here.
/*
Events.onKeyPressed.addListener((key) => {
  if (key === Keyboard.KEY_A && getPlayer() && getGameSpeed() > 0) {
    TweakOneRecipe()
    TweakAllRecipe()
  }
});
*/
Events.onGameBoot.addListener(() => {
  TweakOneRecipe();
  TweakAllRecipe();
});
