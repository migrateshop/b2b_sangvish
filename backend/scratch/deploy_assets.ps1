# PowerShell script to deploy generated PNG images as JPG to backend uploads/products/
Add-Type -AssemblyName System.Drawing

$brainDir = "C:\Users\user\.gemini\antigravity-ide\brain\794c3113-af34-4208-9164-5b2791cf2094"
$destDir = "e:\alibaba_live\backend\uploads\products"

$mappings = @(
    # Digital Non-Contact Infrared Thermometer (664c7e6b0000000000000039)
    @{ src = "thermometer_main_flat_1779349788722.png"; dest = "prod_664c7e6b0000000000000039_main.jpg" },
    @{ src = "thermometer_main_flat_1779349788722.png"; dest = "prod_664c7e6b0000000000000039_sub_0.jpg" },
    @{ src = "thermometer_side_flat_1779349867847.png"; dest = "prod_664c7e6b0000000000000039_sub_1.jpg" },
    @{ src = "thermometer_detail_flat_1779350279338.png"; dest = "prod_664c7e6b0000000000000039_sub_2.jpg" },

    # Stainless Steel Double Wall Vacuum Insulated Water Bottle (664c7e6b000000000000003b)
    @{ src = "water_bottle_main_flat_1779349809710.png"; dest = "prod_664c7e6b000000000000003b_main.jpg" },
    @{ src = "water_bottle_main_flat_1779349809710.png"; dest = "prod_664c7e6b000000000000003b_sub_0.jpg" },
    @{ src = "water_bottle_side_flat_1779349886056.png"; dest = "prod_664c7e6b000000000000003b_sub_1.jpg" },
    @{ src = "water_bottle_detail_flat_1779350303316.png"; dest = "prod_664c7e6b000000000000003b_sub_2.jpg" },

    # Universal Premium Leather Car Seat Covers Set (664c7e6b0000000000000036)
    @{ src = "car_seat_main_flat_1779349825663.png"; dest = "prod_664c7e6b0000000000000036_main.jpg" },
    @{ src = "car_seat_main_flat_1779349825663.png"; dest = "prod_664c7e6b0000000000000036_sub_0.jpg" },
    @{ src = "car_seat_installed_flat_1779349905998.png"; dest = "prod_664c7e6b0000000000000036_sub_1.jpg" },
    @{ src = "car_seat_detail_flat_1779350328784.png"; dest = "prod_664c7e6b0000000000000036_sub_2.jpg" },

    # Industrial Heavy Duty Air Compressor 10HP (664c7e6b0000000000000030)
    @{ src = "compressor_main_flat_1779349841659.png"; dest = "prod_664c7e6b0000000000000030_main.jpg" },
    @{ src = "compressor_main_flat_1779349841659.png"; dest = "prod_664c7e6b0000000000000030_sub_0.jpg" },
    @{ src = "compressor_side_flat_1779349926447.png"; dest = "prod_664c7e6b0000000000000030_sub_1.jpg" },
    @{ src = "compressor_detail_flat_1779350372189.png"; dest = "prod_664c7e6b0000000000000030_sub_2.jpg" }
)

Write-Host "Starting PNG to JPEG conversion and deployment..."

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
