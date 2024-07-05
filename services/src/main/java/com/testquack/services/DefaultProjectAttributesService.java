package com.testquack.services;

import org.springframework.beans.factory.annotation.Autowired;
import com.testquack.beans.DefaultProjectAttributes;
import com.testquack.beans.Role;
import com.testquack.beans.Filter;
import com.testquack.beans.Capability;
import com.testquack.dal.CommonRepository;
import com.testquack.dal.DefaultProjectAttributesRepository;
import ru.greatbit.whoru.auth.Session;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

import static java.util.stream.Collectors.toList;

@Service
public class DefaultProjectAttributesService extends BaseService<DefaultProjectAttributes> {

    @Autowired
    private DefaultProjectAttributesRepository repository;

    @Override
    protected CommonRepository<DefaultProjectAttributes> getRepository() {
        return repository;
    }

    @Override
    public List<DefaultProjectAttributes> findFiltered(Session session, String projectId, Filter filter) {
System.out.println("DefaultProjectAttributesService.findFiltered - session: " + session);
System.out.println("DefaultProjectAttributesService.findFiltered - projectId: " + projectId);
System.out.println("DefaultProjectAttributesService.findFiltered - filter: " + filter);
System.out.flush();
        return getRepository().find(getCurrOrganizationId(session), projectId, filter);
    }

}


