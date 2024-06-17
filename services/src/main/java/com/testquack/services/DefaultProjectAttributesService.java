package com.testquack.services;

import com.testquack.dal.Logger;
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
Logger.info("DefaultProjectAttributesService.findFiltered - session: " + session);
Logger.info("DefaultProjectAttributesService.findFiltered - projectId: " + projectId);
Logger.info("DefaultProjectAttributesService.findFiltered - filter: " + filter);
        return getRepository().find(getCurrOrganizationId(session), projectId, filter);
    }

}


