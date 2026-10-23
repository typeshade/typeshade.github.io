# Function page template

The page must help a reader who does not use TypeShade. Start with the mathematical meaning,
an interactive explanation, a practical use, and input limits. Put compiler-specific signatures
and descriptions after this explanation. Full shader source is optional reading.

## Interactive example

- Keep the canvas compact and centred, with its aspect ratio preserved.
- Label the input and output axes and display their ranges beside the plot.
- Put controls directly below the result. Keep slider labels above the inputs.
- Show the function expression before the plot. Put the complete editable program in a disclosure.
- Use valid input ranges. State that the graph shows a bounded window of the function.
- Draw a highlighted input point so a reader can connect a control to the curve.
- Give a worked calculation, evaluated at build time, beside the practical use. State that
  its rounded reference result is separate from shader precision guarantees.
- Compile the same TypeShade program to WebGPU and WebGL2. Capture a fallback still from it.
- Keep the compiler behind the first edit, using the existing LiveShader implementation.

## Application

The first catalogue covers scalar mathematical functions and vector magnitude examples that
produce a scalar result. Each entry supplies its expression, input range, output range, and
optional parameter control. Page copy and labels come from both language dictionaries.

Texture access, atomics, synchronization, and declarations use worked resource or execution
models. Each model states its assumptions and offers contrasting cases. These examples are
readable without JavaScript and do not claim to execute GPU work. Texture examples show texels
and filtering; atomic examples distinguish the old value, return value, and stored value;
barrier examples show workgroup participation and memory scope. Constructors show components
or matrix columns. Bit operations show the full word and its component bits.

Every function must have either a live mathematical example, the authored Pow note, or a
worked model. Coverage is checked against the pinned compiler's function table. Generated
compiler signatures and target restrictions remain on every page after its lesson.

## Review

Compile every catalogue entry. Verify that the call names the documented function. Exercise
controls and editing on WebGPU and WebGL2. Capture desktop and mobile views in both themes
and languages. Check sizing, axis labels, slider width, fallback images, and horizontal overflow.

Pow remains the authored example for domain restrictions and practical shading. Its interactive
examples use the same compact presentation as the catalogue.
