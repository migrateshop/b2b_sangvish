# PowerShell script to deploy generated PNG images as JPG to backend uploads/products/ for CNC, LED Wall, and Mesh Office Chair
Add-Type -AssemblyName System.Drawing

$brainDir = "C:\Users\user\.gemini\antigravity-ide\brain\794c3113-af34-4208-9164-5b2791cf2094"
$destDir = "e:\alibaba_live\backend\uploads\products"

$mappings = @(
    # Professional Vertical CNC Machining Center VMC-850 (664c7e6b0000000000000031)
    @{ src = "cnc_main_flat_1779350645870.png"; dest = "prod_664c7e6b0000000000000031_main.jpg" },
    @{ src = "cnc_main_flat_1779350645870.png"; dest = "prod_664c7e6b0000000000000031_sub_0.jpg" },
    @{ src = "cnc_side_flat_1779350676253.png"; dest = "prod_664c7e6b0000000000000031_sub_1.jpg" },
    @{ src = "cnc_detail_flat_1779350843431.png"; dest = "prod_664c7e6b0000000000000031_sub_2.jpg" },

    # Full Color Indoor P2.5 LED Video Wall Stage Screen (664c7e6b0000000000000033)
    @{ src = "led_wall_main_flat_1779350867941.png"; dest = "prod_664c7e6b0000000000000033_main.jpg" },
    @{ src = "led_wall_main_flat_1779350867941.png"; dest = "prod_664c7e6b0000000000000033_sub_0.jpg" },
    @{ src = "led_wall_side_flat_1779350894134.png"; dest = "prod_664c7e6b0000000000000033_sub_1.jpg" },
    @{ src = "led_wall_detail_flat_1779350921489.png"; dest = "prod_664c7e6b0000000000000033_sub_2.jpg" },

    # Wholesale Modern Ergonomic Mesh Office Chair (664c7e6b0000000000000034)
    @{ src = "office_chair_main_flat_1779350943149.png"; dest = "prod_664c7e6b0000000000000034_main.jpg" },
    @{ src = "office_chair_main_flat_1779350943149.png"; dest = "prod_664c7e6b0000000000000034_sub_0.jpg" },
    @{ src = "office_chair_side_flat_1779350969824.png"; dest = "prod_664c7e6b0000000000000034_sub_1.jpg" },
    @{ src = "office_chair_detail_flat_1779351002450.png"; dest = "prod_664c7e6b0000000000000034_sub_2.jpg" }
)

Write-Host "Starting PNG to JPEG conversion and deployment (Part 3)..."

foreach ($map in $mappings) {
    $srcPath = Join-Path $brainDir $map.src
    $destPath = Join-Path $destDir $map.dest
    
    if (Test-Path $srcPath) {
        Write-Host "Converting $srcPath to $destPath"
        
        # Load the image
        $img = [System.Drawing.Image]::FromFile($srcPath)
        
        # Save as Jpeg
        $img.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
        
        # Dispose the image object
        $img.Dispose()
        
        Write-Host "Successfully deployed $destPath"
    } else {
        Write-Warning "Source file not found: $srcPath"
    }
}

Write-Host "Finished image deployment."
