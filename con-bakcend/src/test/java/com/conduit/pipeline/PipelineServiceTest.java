package com.conduit.pipeline;

import com.conduit.storage.StorageService;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PipelineServiceTest {

    @Test
    void createDefaultsStatusToActiveWhenNotProvided() {
        StorageService storageService = mock(StorageService.class);
        when(storageService.readList("pipelines", Pipeline.class)).thenReturn(new ArrayList<>());

        PipelineService pipelineService = new PipelineService(storageService);

        Pipeline input = new Pipeline();
        input.setName("build-main");

        Pipeline created = pipelineService.create(input, "tester");

        assertEquals(PipelineStatus.ACTIVE, created.getStatus());
        assertNotNull(created.getId());
        verify(storageService).write(eq("pipelines"), any(List.class));
    }

    @Test
    void createUsesProvidedStatusWhenPresent() {
        StorageService storageService = mock(StorageService.class);
        when(storageService.readList("pipelines", Pipeline.class)).thenReturn(new ArrayList<>());

        PipelineService pipelineService = new PipelineService(storageService);

        Pipeline input = new Pipeline();
        input.setName("build-release");
        input.setStatus(PipelineStatus.PAUSED);

        Pipeline created = pipelineService.create(input, "tester");

        assertEquals(PipelineStatus.PAUSED, created.getStatus());
        verify(storageService).write(eq("pipelines"), any(List.class));
    }
}

