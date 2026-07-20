-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "Booking_customerId_createdAt_idx" ON "Booking"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "Booking_technicianProfileId_createdAt_idx" ON "Booking"("technicianProfileId", "createdAt");

-- CreateIndex
CREATE INDEX "Booking_serviceId_idx" ON "Booking"("serviceId");

-- CreateIndex
CREATE INDEX "Service_categoryId_createdAt_idx" ON "Service"("categoryId", "createdAt");

-- CreateIndex
CREATE INDEX "Service_technicianProfileId_idx" ON "Service"("technicianProfileId");

-- CreateIndex
CREATE INDEX "Service_price_idx" ON "Service"("price");

-- CreateIndex
CREATE INDEX "TechnicianProfile_averageRating_idx" ON "TechnicianProfile"("averageRating");

-- CreateIndex
CREATE INDEX "TechnicianProfile_hourlyRate_idx" ON "TechnicianProfile"("hourlyRate");

-- CreateIndex
CREATE INDEX "Review_customerId_idx" ON "Review"("customerId");

-- CreateIndex
CREATE INDEX "Review_technicianProfileId_idx" ON "Review"("technicianProfileId");
