package com.untold.backend.controller;

import com.untold.backend.dto.MapDto;
import com.untold.backend.dto.response.ApiResponse;
import com.untold.backend.model.MapPin;
import com.untold.backend.model.VenueMap;
import com.untold.backend.repository.MapPinRepository;
import com.untold.backend.repository.VenueMapRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.*;
import java.util.*;
import java.util.stream.Collectors;

@RestController
public class MapController {

    private final VenueMapRepository venueMapRepository;
    private final MapPinRepository mapPinRepository;

    public MapController(VenueMapRepository venueMapRepository, MapPinRepository mapPinRepository) {
        this.venueMapRepository = venueMapRepository;
        this.mapPinRepository = mapPinRepository;
    }

    @GetMapping("/api/map/active")
    public ResponseEntity<ApiResponse<MapDto>> getActiveMap() {
        Optional<VenueMap> activeMapOpt = venueMapRepository.findFirstByIsActiveTrueOrderByCreatedAtDesc();
        if (activeMapOpt.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.success("No active map configured", null));
        }
        MapDto dto = convertToDto(activeMapOpt.get());
        return ResponseEntity.ok(ApiResponse.success("Active map retrieved successfully", dto));
    }

    @PostMapping("/api/admin/map/upload")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadMapImage(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Uploaded file is empty"));
            }

            // Validate MIME Type (must be an image)
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Formatul fișierului este invalid. Sunt permise doar imagini (PNG, JPEG, WEBP)."));
            }

            // Validate File Size (15MB limit)
            long maxSizeBytes = 15 * 1024 * 1024; // 15MB
            if (file.getSize() > maxSizeBytes) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Dimensiunea fișierului depășește limita maximă admisă de 15MB."));
            }

            // Create uploads directory in workspace/server root
            Path uploadPath = Paths.get("uploads");
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Generate unique name to avoid collisions
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String newFilename = UUID.randomUUID().toString() + extension;

            Path targetLocation = uploadPath.resolve(newFilename);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            String fileUrl = "/uploads/" + newFilename;
            Map<String, String> response = Map.of("imageUrl", fileUrl);

            return ResponseEntity.ok(ApiResponse.success("Map image uploaded successfully", response));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to store map image file: " + e.getMessage()));
        }
    }

    @PostMapping("/api/admin/map/save")
    public ResponseEntity<ApiResponse<MapDto>> saveMapLayout(@RequestBody MapDto dto) {
        try {
            if (dto.getImageUrl() == null || dto.getImageUrl().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Map image URL is required"));
            }

            // Find if there is an existing active map
            Optional<VenueMap> activeMapOpt = venueMapRepository.findFirstByIsActiveTrueOrderByCreatedAtDesc();
            VenueMap venueMap;
            
            if (activeMapOpt.isPresent()) {
                venueMap = activeMapOpt.get();
                // Update map image url
                venueMap.setImageUrl(dto.getImageUrl());
                
                // Map existing pins by their ID for easy lookup
                Map<Long, MapPin> existingPinsMap = new HashMap<>();
                for (MapPin pin : venueMap.getPins()) {
                    if (pin.getId() != null) {
                        existingPinsMap.put(pin.getId(), pin);
                    }
                }
                
                // Track which pins are still present in the incoming DTO
                List<MapPin> updatedPins = new ArrayList<>();
                
                if (dto.getPins() != null) {
                    for (MapDto.PinDto pinDto : dto.getPins()) {
                        if (pinDto.getId() != null && existingPinsMap.containsKey(pinDto.getId())) {
                            // Update existing pin in-place
                            MapPin pin = existingPinsMap.get(pinDto.getId());
                            pin.setType(pinDto.getType());
                            pin.setName(pinDto.getName());
                            pin.setDescription(pinDto.getDescription());
                            pin.setXPos(pinDto.getXPos());
                            pin.setYPos(pinDto.getYPos());
                            updatedPins.add(pin);
                        } else {
                            // It's a new pin
                            MapPin pin = new MapPin();
                            pin.setVenueMap(venueMap);
                            pin.setType(pinDto.getType());
                            pin.setName(pinDto.getName());
                            pin.setDescription(pinDto.getDescription());
                            pin.setXPos(pinDto.getXPos());
                            pin.setYPos(pinDto.getYPos());
                            updatedPins.add(pin);
                        }
                    }
                }
                
                // Pins that are not in the incoming set will be deleted.
                // Clear the existing list and re-populate with the updated list.
                // Because orphanRemoval = true is active, any MapPin removed from the collection is deleted.
                venueMap.getPins().clear();
                venueMap.getPins().addAll(updatedPins);
                
            } else {
                // Deactivate all existing maps (just in case)
                List<VenueMap> existingMaps = venueMapRepository.findAll();
                for (VenueMap existing : existingMaps) {
                    if (existing.isActive()) {
                        existing.setActive(false);
                        venueMapRepository.save(existing);
                    }
                }
                
                // Create a new map
                venueMap = new VenueMap();
                venueMap.setImageUrl(dto.getImageUrl());
                venueMap.setActive(true);
                
                if (dto.getPins() != null) {
                    for (MapDto.PinDto pinDto : dto.getPins()) {
                        MapPin pin = new MapPin();
                        pin.setVenueMap(venueMap);
                        pin.setType(pinDto.getType());
                        pin.setName(pinDto.getName());
                        pin.setDescription(pinDto.getDescription());
                        pin.setXPos(pinDto.getXPos());
                        pin.setYPos(pinDto.getYPos());
                        venueMap.getPins().add(pin);
                    }
                }
            }

            VenueMap savedMap = venueMapRepository.save(venueMap);
            MapDto responseDto = convertToDto(savedMap);

            return ResponseEntity.ok(ApiResponse.success("Map layout and pins saved successfully", responseDto));
        } catch (org.springframework.dao.DataIntegrityViolationException dive) {
            // Check if it's due to performance delete constraints
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error("Nu se poate șterge sau modifica acest pin deoarece are spectacole active programate pe această scenă. Vă rugăm să ștergeți mai întâi spectacolele din Lineup!"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error saving map layout: " + e.getMessage()));
        }
    }

    private MapDto convertToDto(VenueMap map) {
        if (map == null) return null;
        List<MapDto.PinDto> pins = map.getPins().stream()
                .map(pin -> new MapDto.PinDto(
                        pin.getId(),
                        pin.getType(),
                        pin.getName(),
                        pin.getDescription(),
                        pin.getXPos(),
                        pin.getYPos()
                ))
                .collect(Collectors.toList());
        return new MapDto(map.getId(), map.getImageUrl(), map.isActive(), pins);
    }
}
