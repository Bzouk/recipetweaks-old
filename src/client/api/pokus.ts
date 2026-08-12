/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * @noSelfInFile
 *
 * NOTE: Use this at the top of your TypeScript files. This prevents functions & methods
 *       from prepending a 'self' reference, which is usually not necessary and complicates
 *       rendered Lua code.
 */
/**
 * @noSelfInFile
 *
 * NOTE: Use this at the top of your TypeScript files. This prevents functions & methods
 *       from prepending a 'self' reference, which is usually not necessary and complicates
 *       rendered Lua code.
 */

import { IsoPlayer, Result, java } from "@asledgehammer/pipewrench";


declare let a: (para: string) => string;

interface Dictionary<U> {
  [key: string]: U;
}

type GetItemTypesTF = (scriptItems: java.util.ArrayList<string>) => any
type OnCreateTF = (items: java.util.ArrayList<string>, result: Result, player: IsoPlayer, selectedItem:  java.util.ArrayList<string> ) => any

type ReCipeFunTable = Dictionary< Dictionary<GetItemTypesTF | OnCreateTF >>;

declare let Recipe: ReCipeFunTable;

Recipe = {}
Recipe.GetItemTypes = {}
Recipe.OnCanPerform = {}
Recipe.OnCreate = {}
Recipe.OnGiveXP = {}
Recipe.OnTest = {}

Recipe.OnCreate.HotCuppa = function HotCuppa() {
  return
}

a = function(pass: string): string {
  return pass;
};


