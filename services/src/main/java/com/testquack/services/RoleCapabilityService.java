package com.testquack.services;

import org.springframework.beans.factory.annotation.Autowired;
import com.testquack.beans.RoleCapability;
import com.testquack.beans.Role;
import com.testquack.beans.Capability;
import com.testquack.dal.CommonRepository;
import com.testquack.dal.RoleCapabilityRepository;
import ru.greatbit.whoru.auth.Session;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

@Service
public class RoleCapabilityService extends BaseService<RoleCapability> {

    @Autowired
    private RoleCapabilityRepository repository;

    @Override
    protected CommonRepository<RoleCapability> getRepository() {
        return repository;
    }

    @Override
    public RoleCapability findOne(Session session, String projectId, String id) {

System.out.println("RoleCapService.findOne - projectId, id: " + projectId + "," + id);
System.out.println("RoleCapService.findOne - session: " + session);
System.out.flush();

        //return cleanUserSesitiveData(super.findOne(session, projectId, id));
        RoleCapability rolecap = cleanRoleCapabilitySensitiveData(super.findOne(session, projectId, id));

System.out.println("RoleCapService.findOne - rolecap: " + rolecap);
System.out.flush();

        return rolecap;
    }

    public List<RoleCapability> findAll() {
System.out.println("RoleCapService.findAll");
System.out.flush();

System.out.println("RoleCapService.findAll - splitIterator: " + repository.findAll().spliterator());
System.out.flush();

        List<RoleCapability> roleCapList = StreamSupport.stream(repository.findAll().spliterator(), false).collect(Collectors.toList());

        return roleCapList;
    }

    private RoleCapability cleanRoleCapabilitySensitiveData(RoleCapability rolecap){
        return rolecap.withRole(null).withCapability(null);
    }



}


