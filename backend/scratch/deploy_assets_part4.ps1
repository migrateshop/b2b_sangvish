# PowerShell script to deploy generated PNG images as JPG to backend uploads/products/ for Shipping Boxes, Impact Wrench, and TWS Earbuds
# Drawing transparent PNGs onto a solid white background to prevent transparent areas from turning black in JPEGs.
Add-Type -AssemblyName System.Drawing

$brainDir = "C:\Users\user\.gemini\antigravity-ide\brain\794c3113-af34-4208-9164-5b2791cf2094"
$destDir = "e:\alibaba_live\backend\uploads\products"

$mappings = @(
    # Custom Printed Corrugated Shipping Boxes (664c7e6b0000000000000038)
    @{ src = "boxes_main_1779354139418.png"; dest = "prod_664c7e6b0000000000000038_main.jpg" },
    @{ src = "boxes_main_1779354139418.png"; dest = "prod_664c7e6b0000000000000038_sub_0.jpg" },
    @{ src = "boxes_side_1779354164359.png"; dest = "prod_664c7e6b0000000000000038_sub_1.jpg" },
    @{ src = "boxes_detail_1779354194101.png"; dest = "prod_664c7e6b0000000000000038_sub_2.jpg" },

    # Brushless Cordless Impact Wrench 20V Max (664c7e6b000000000000003d)
    @{ src = "wrench_main_1779354219313.png"; dest = "prod_664c7e6b000000000000003d_main.jpg" },
    @{ src = "wrench_main_1779354219313.png"; dest = "prod_664c7e6b000000000000003d_sub_0.jpg" },
    @{ src = "wrench_side_1779354246810.png"; dest = "prod_664c7e6b000000000000003d_sub_1.jpg" },
    @{ src = "wrench_detail_1779354276775.png"; dest = "prod_664c7e6b000000000000003d_sub_2.jpg" },

    # Bluetooth 5.3 True Wireless Earbuds TWS (664c7e6b000000000000003a)
    @{ src = "earbuds_main_1779354299136.png"; dest = "prod_664c7e6b000000000000003a_main.jpg" },
    @{ src = "earbuds_main_1779354299136.png"; dest = "prod_664c7e6b000000000000003a_sub_0.jpg" },
    @{ src = "earbuds_side_1779354323346.png"; dest = "prod_664c7e6b000000000000003a_sub_1.jpg" },
    @{ src = "earbuds_detail_flat_1779354368323.png"; dest = "prod_664c7e6b000000000000003a_sub_2.jpg" }
)

Write-Host "Starting PNG to JPEG (solid white background) conversion and deployment..."

foreach ($map in $mappings) {
    $srcPath = Join-Path $brainDir $map.src
    $destPath = Join-Path $destDir $map.dest
    
    if (Test-Path $srcPath) {
        Write-Host "Converting $srcPath to $destPath with a white background"
        
        # Load the source PNG image
        $srcImg = [System.Drawing.Image]::FromFile($srcPath)
        
        # Create a new blank bitmap with the same size
        $bmp = New-Object System.Drawing.Bitmap($srcImg.Width, $srcImg.Height)
        
        # Get graphics context for drawing
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        
        # Fill background with pure white
        $g.Clear([System.Drawing.Color]::White)
        
        # Draw the source image on top of white background
        $g.DrawImage($srcImg, 0, 0, $srcImg.Width, $srcImg.Height)
        
        # Save the combined bitmap as JPEG
        $bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
        
        # Dispose all objects to free file locks
        $g.Dispose()
        $bmp.Dispose()
        $srcImg.Dispose()
        
        Write-Host "Successfully deployed $destPath"
    } else {
        Write-Warning "Source file not found: $srcPath"
    }
}

Write-Host "Finished image deployment."
