using UnrealBuildTool;

public class PhobiaHorrorGame : ModuleRules
{
    public PhobiaHorrorGame(ReadOnlyTargetRules Target) : base(Target)
    {
        PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;

        PublicDependencyModuleNames.AddRange(new string[]
        {
            "Core",
            "CoreUObject",
            "Engine",
            "InputCore",
            "EnhancedInput",
            "AIModule",
            "NavigationSystem",
            "GameplayTasks",
            "UMG",
            "Slate",
            "SlateCore",
            "Niagara",
        });

        PrivateDependencyModuleNames.AddRange(new string[]
        {
            "PhysicsCore",
        });
    }
}
