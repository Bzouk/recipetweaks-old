
/**
 * @noSelfInFile
 *
 * NOTE: Use this at the top of your TypeScript files. This prevents functions & methods
 *       from prepending a 'self' reference, which is usually not necessary and complicates
 *       rendered Lua code.
 */

import { getActivatedMods } from "@asledgehammer/pipewrench";
import { AddTweakAllRecipe, AddTweakOneRecipe, CreateFilter, CreateResultChanges, CreateRecipeSourceChanges, WhenAdd, GetItemsListByTag } from "./api/RecipeAPi";

if (getActivatedMods().contains('Hydrocraft')) {
    AddTweakOneRecipe("Hydrocraft.Make Tailor's Workbench",CreateRecipeSourceChanges('Hydrocraft.HCBoneneedle', ['Base.Needle']))
    AddTweakAllRecipe(CreateRecipeSourceChanges("Hydrocraft.HCWoodenbucketvegoil",undefined,0,480,WhenAdd.NORULE),undefined,CreateFilter("Hydrocraft",["Hydrocraft.Fill Trough with Vegetable Oil"]))
    AddTweakAllRecipe(CreateRecipeSourceChanges("Base.Needle", ["Hydrocraft.HCBoneneedle"] ))
    AddTweakAllRecipe(CreateRecipeSourceChanges("Hydrocraft.HCWoodenbucketconcrete", ["Base.BucketConcreteFull"],undefined,undefined,WhenAdd.NODESTROY),undefined, CreateFilter("Hydrocraft"))
    AddTweakAllRecipe(CreateRecipeSourceChanges("Base.Hammer",GetItemsListByTag("Hammer")),undefined,CreateFilter("Hydrocraft"))
    AddTweakAllRecipe(undefined,CreateResultChanges(5),CreateFilter("Hydrocraft",["Hydrocraft.Make Bottle of Juice"],undefined,undefined,1)) //CreateRecipeSourceChanges("Base.Apple", [],undefined,undefined,WhenAdd.NODESTROY)
}

if (getActivatedMods().contains("Hydrocraft") && getActivatedMods().contains("DLTS")) {
    AddTweakOneRecipe("DLTS.LTS Cut Bits of Mushroom",CreateRecipeSourceChanges('Base.MushroomGeneric1',
    [
        "Hydrocraft.HCPortobello",
        "Hydrocraft.HCShiitake",
        "Hydrocraft.HCBlewitshroom",
        "Hydrocraft.HCBlewitshroom",
        "Hydrocraft.HCLobstershroom",
        "Hydrocraft.HCWitchshatshroom",
        "Hydrocraft.HCYellowmorelshroom",
        "Hydrocraft.HCChantrelle",
    ]))
}
