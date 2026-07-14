const fs = require('fs');
const filePath = 'app/api/admin/submissions/route.ts';
let code = fs.readFileSync(filePath, 'utf8');

// Replace the update logic to also update components table
const newUpdateLogic = `
    const { error } = await supabaseAdmin
      .from("submissions")
      .update({ status, moderators_feedback })
      .eq("component_id", componentId)

    if (error) {
      console.error("Error updating submission:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Also update the is_public status of the component based on the new status
    const isPublic = status === "posted" || status === "featured";
    const { error: componentError } = await supabaseAdmin
      .from("components")
      .update({ is_public: isPublic })
      .eq("id", componentId);

    if (componentError) {
      console.error("Error updating component is_public:", componentError)
      return NextResponse.json({ error: componentError.message }, { status: 500 })
    }
`;

code = code.replace(/    const { error } = await supabaseAdmin\s*\n\s*\.from\("submissions"\)\s*\n\s*\.update\({ status, moderators_feedback }\)\s*\n\s*\.eq\("component_id", componentId\)\s*\n\s*if \(error\) {\s*\n\s*console\.error\("Error updating submission:", error\)\s*\n\s*return NextResponse\.json\({ error: error\.message }, { status: 500 }\)\s*\n\s*}/, newUpdateLogic);

fs.writeFileSync(filePath, code);
