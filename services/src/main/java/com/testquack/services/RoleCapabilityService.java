package com.testquack.services;

import org.springframework.beans.factory.annotation.Autowired;
import com.testquack.beans.RoleCapability;
import com.testquack.beans.Role;
import com.testquack.beans.Filter;
import com.testquack.beans.Capability;
import com.testquack.dal.CommonRepository;
import com.testquack.dal.RoleCapabilityRepository;
import ru.greatbit.whoru.auth.Session;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

import static java.util.stream.Collectors.toList;

@Service
public class RoleCapabilityService extends BaseService<RoleCapability> {

    @Autowired
    private RoleCapabilityRepository repository;

    @Override
    protected CommonRepository<RoleCapability> getRepository() {
        return repository;
    }

    @Override
    public List<RoleCapability> findFiltered(Session session, String projectId, Filter filter) {
System.out.println("RoleCapService.findFiltered - session: " + session);
System.out.println("RoleCapService.findFiltered - projectId: " + projectId);
System.out.println("RoleCapService.findFiltered - filter: " + filter);
System.out.flush();
        return getRepository().find(getCurrOrganizationId(session), projectId, filter);
    }

}


