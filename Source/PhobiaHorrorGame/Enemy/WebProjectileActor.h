#pragma once
#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "WebProjectileActor.generated.h"

class UProjectileMovementComponent;
class USphereComponent;
class UStaticMeshComponent;

UCLASS()
class PHOBIAHORORGAME_API AWebProjectileActor : public AActor
{
    GENERATED_BODY()

public:
    AWebProjectileActor();

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
    USphereComponent* CollisionComp;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
    UStaticMeshComponent* MeshComp;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
    UProjectileMovementComponent* MovementComp;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Web")
    float ProjectileSpeed = 1200.f;

    UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Web")
    float Lifetime = 5.f;

    void Initialize(FVector Direction, float InSlowDuration);

protected:
    virtual void BeginPlay() override;

private:
    float SlowDuration = 3.f;
    bool bHasHit = false;

    UFUNCTION()
    void OnHit(UPrimitiveComponent* HitComp, AActor* OtherActor,
               UPrimitiveComponent* OtherComp, FVector NormalImpulse, const FHitResult& Hit);
};
