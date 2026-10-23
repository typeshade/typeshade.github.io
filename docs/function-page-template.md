# Function page template

The function reference uses compiler-generated signatures and descriptions. Authored examples
explain the result beside the actual program that produces it.

## Interactive example

- Keep the canvas compact and centred, with its aspect ratio preserved.
- Label the input and output axes and display their ranges beside the plot.
- Put controls directly below the result. Keep slider labels above the inputs.
- Show the function expression before the plot. Put the complete editable program in a disclosure.
- Use valid input ranges. State that the graph shows a bounded window of the function.
- Draw a highlighted input point so a reader can connect a control to the curve.
- Compile the same TypeShade program to WebGPU and WebGL2. Capture a fallback still from it.
- Keep the compiler behind the first edit, using the existing LiveShader implementation.

## Application

The first catalogue covers scalar mathematical functions and vector magnitude examples that
produce a scalar result. Each entry supplies its expression, input range, output range, and
optional parameter control. Page copy and labels come from both language dictionaries.

Texture access, atomics, synchronization, and declarations need examples of their resources
or execution model. A scalar curve cannot explain those operations. Keep their generated
reference and corpus examples until a suitable example is supplied.

## Review

Compile every catalogue entry. Verify that the call names the documented function. Exercise
controls and editing on WebGPU and WebGL2. Capture desktop and mobile views in both themes
and languages. Check sizing, axis labels, slider width, fallback images, and horizontal overflow.

Pow remains the authored example for domain restrictions and practical shading. Its interactive
examples use the same compact presentation as the catalogue.
