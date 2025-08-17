export function StereoscopicEffects(renderer: any, effect: number | string): void;

type EffectDesc = {
	name: string;
	value: number;
}

type EffectCategory = {
	category: string;
	elements: EffectDesc[];
}

export namespace StereoscopicEffects {
    function setThreeJS(t: any): void;
    function effectsList(): EffectCategory[];
    function effectsListSelect(name?: string): HTMLSelectElement;
}

export class StereoscopicEffects {
    constructor(renderer: any, effect: number | string);
    setEyeSeparation: (sep: number) => void;
    setSize: (width: number, height: number) => void;
    render: (scene: any, camera: any) => void;
    dispose: () => void;
    setEffect: (effect: number | string) => void;
}
