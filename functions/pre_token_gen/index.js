exports.handler = async (event) => {
    // This lambda is triggered by Cognito's Pre-Token Generation trigger
    // We can add custom claims to the ID token here.

    const response = { ...event.response };

    // Example: Add a custom claim 'custom:role'
    response.claimsOverrideDetails = {
        claimsToAddOrOverride: {
            "custom:role": "user",
            "custom:generated_by": "antigravity-lambda"
        }
    };

    event.response = response;
    return event;
};
